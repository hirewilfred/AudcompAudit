// ConnectWise Manage REST API client.
// Auth: Authorization: Basic base64("{companyId}+{publicKey}":"{privateKey}") + clientId header.
// Docs: https://developer.connectwise.com/Products/ConnectWise_PSA/REST

const SITE = process.env.CW_SITE || 'api-na.myconnectwise.net';
const COMPANY_ID = process.env.CW_COMPANY_ID || '';
const PUBLIC_KEY = process.env.CW_PUBLIC_KEY || '';
const PRIVATE_KEY = process.env.CW_PRIVATE_KEY || '';
const CLIENT_ID = process.env.CW_CLIENT_ID || '';

export class ConnectWiseError extends Error {
    constructor(message: string, public status?: number, public body?: unknown) {
        super(message);
    }
}

export function isConnectWiseConfigured() {
    return Boolean(SITE && COMPANY_ID && PUBLIC_KEY && PRIVATE_KEY && CLIENT_ID);
}

function authHeader() {
    const raw = `${COMPANY_ID}+${PUBLIC_KEY}:${PRIVATE_KEY}`;
    const encoded = typeof btoa !== 'undefined'
        ? btoa(raw)
        : Buffer.from(raw, 'utf-8').toString('base64');
    return `Basic ${encoded}`;
}

type Query = Record<string, string | number | boolean | undefined>;

function buildUrl(path: string, query?: Query) {
    const url = new URL(`https://${SITE}/v4_6_release/apis/3.0${path}`);
    if (query) {
        for (const [k, v] of Object.entries(query)) {
            if (v === undefined || v === null) continue;
            url.searchParams.append(k, String(v));
        }
    }
    return url.toString();
}

export async function cwFetch<T = unknown>(
    path: string,
    opts: { query?: Query; method?: string; body?: unknown } = {},
): Promise<T> {
    if (!isConnectWiseConfigured()) {
        throw new ConnectWiseError('ConnectWise environment variables are not set');
    }
    const res = await fetch(buildUrl(path, opts.query), {
        method: opts.method ?? 'GET',
        headers: {
            Authorization: authHeader(),
            clientId: CLIENT_ID,
            Accept: 'application/json',
            'Content-Type': 'application/json',
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
        cache: 'no-store',
    });
    const text = await res.text();
    const data = text ? safeJson(text) : null;
    if (!res.ok) {
        throw new ConnectWiseError(
            `ConnectWise ${res.status} on ${opts.method ?? 'GET'} ${path}`,
            res.status,
            data ?? text,
        );
    }
    return data as T;
}

function safeJson(s: string) {
    try { return JSON.parse(s); } catch { return s; }
}

// Pulls all pages for endpoints that support pageSize/page (most CW list endpoints).
export async function cwFetchAll<T = unknown>(
    path: string,
    query: Query = {},
    pageSize = 1000,
): Promise<T[]> {
    const results: T[] = [];
    let page = 1;
    // Hard cap to avoid runaway loops on misconfigured queries.
    while (page <= 100) {
        const batch = await cwFetch<T[]>(path, {
            query: { ...query, pageSize, page },
        });
        if (!Array.isArray(batch) || batch.length === 0) break;
        results.push(...batch);
        if (batch.length < pageSize) break;
        page++;
    }
    return results;
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
