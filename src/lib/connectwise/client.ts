// ConnectWise Manage REST API client.
// Auth: Authorization: Basic base64("{companyId}+{publicKey}":"{privateKey}") + clientId header.
// Docs: https://developer.connectwise.com/Products/ConnectWise_PSA/REST

export class ConnectWiseError extends Error {
    constructor(message: string, public status?: number, public body?: unknown) {
        super(message);
    }
}

function env() {
    return {
        site: process.env.CW_SITE || 'api-na.myconnectwise.net',
        companyId: process.env.CW_COMPANY_ID || '',
        publicKey: process.env.CW_PUBLIC_KEY || '',
        privateKey: process.env.CW_PRIVATE_KEY || '',
        clientId: process.env.CW_CLIENT_ID || '',
    };
}

export function isConnectWiseConfigured() {
    const e = env();
    return Boolean(e.site && e.companyId && e.publicKey && e.privateKey && e.clientId);
}

function authHeader() {
    const e = env();
    const raw = `${e.companyId}+${e.publicKey}:${e.privateKey}`;
    return `Basic ${Buffer.from(raw, 'utf-8').toString('base64')}`;
}

type Query = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, query?: Query) {
    const url = new URL(`https://${env().site}/v4_6_release/apis/3.0${path}`);
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined || v === null) continue;
            url.searchParams.append(k, String(v));
        }
    }
    return url.toString();
}

const TIMEOUT_MS = Number(process.env.CW_TIMEOUT_MS || 30_000);
const MAX_RETRIES = Number(process.env.CW_MAX_RETRIES || 3);

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function cwFetch<T = unknown>(
    path: string,
    opts: { query?: Query; method?: string; body?: unknown } = {},
): Promise<T> {
    if (!isConnectWiseConfigured()) {
        throw new ConnectWiseError('ConnectWise environment variables are not set');
    }
    const e = env();
    const url = buildUrl(path, opts.query);
    const method = opts.method ?? 'GET';

    let attempt = 0;
    // First call counts as attempt 1; we retry up to MAX_RETRIES extra times on transient failures.
    while (true) {
        attempt++;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
        let res: Response;
        try {
            res = await fetch(url, {
                method,
                headers: {
                    Authorization: authHeader(),
                    clientId: e.clientId,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: opts.body ? JSON.stringify(opts.body) : undefined,
                cache: 'no-store',
                signal: controller.signal,
            });
        } catch (err) {
            clearTimeout(timer);
            // Network error / timeout — retry on idempotent methods.
            const isIdempotent = method === 'GET' || method === 'HEAD';
            if (isIdempotent && attempt <= MAX_RETRIES) {
                await sleep(backoffMs(attempt));
                continue;
            }
            throw new ConnectWiseError(`ConnectWise network error on ${method} ${path}: ${(err as Error).message}`);
        }
        clearTimeout(timer);

        const text = await res.text();
        const data = text ? safeJson(text) : null;

        if (res.ok) return data as T;

        // 429 and 5xx are retryable; honor Retry-After when present.
        const retryable = res.status === 429 || (res.status >= 500 && res.status < 600);
        if (retryable && attempt <= MAX_RETRIES) {
            const retryAfter = parseRetryAfter(res.headers.get('retry-after'));
            await sleep(retryAfter ?? backoffMs(attempt));
            continue;
        }
        throw new ConnectWiseError(
            `ConnectWise ${res.status} on ${method} ${path}`,
            res.status,
            data ?? text,
        );
    }
}

function backoffMs(attempt: number) {
    // Exponential backoff with jitter: 500ms, 1s, 2s, 4s ...
    const base = 500 * Math.pow(2, attempt - 1);
    return base + Math.floor(Math.random() * 250);
}

function parseRetryAfter(value: string | null): number | null {
    if (!value) return null;
    const seconds = Number(value);
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
    const when = Date.parse(value);
    if (!Number.isNaN(when)) return Math.max(0, when - Date.now());
    return null;
}

function safeJson(s: string) {
    try { return JSON.parse(s); } catch { return s; }
}

const MAX_PAGES = Number(process.env.CW_MAX_PAGES || 200);

// Pulls all pages for endpoints that support pageSize/page (most CW list endpoints).
export async function cwFetchAll<T = unknown>(
    path: string,
    query: Query = {},
    pageSize = 1000,
): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    while (page <= MAX_PAGES) {
        const batch = await cwFetch<T[]>(path, {
            query: { ...query, pageSize, page },
        });
        if (!Array.isArray(batch) || batch.length === 0) break;
        results.push(...batch);
        if (batch.length < pageSize) return results;
        page++;
    }
    // If we exit the loop because we hit MAX_PAGES with a full last batch, the result is incomplete.
    throw new ConnectWiseError(
        `cwFetchAll hit MAX_PAGES (${MAX_PAGES}) on ${path} — refine query or raise CW_MAX_PAGES`,
    );
}

// Builds a CW conditions string. Pass an array of clauses joined with " and ".
// Example: cwConditions(["board/id=42", "status/name='Pending Closure'"])
export function cwConditions(clauses: Array<string | null | undefined>) {
    return clauses.filter(Boolean).join(' and ');
}

// CW datetime format: [yyyy-MM-ddTHH:mm:ssZ]
export function cwDate(d: Date) {
    return `[${d.toISOString().split('.')[0]}Z]`;
}
