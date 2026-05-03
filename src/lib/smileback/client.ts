// SmileBack CSAT API client.
// Docs: https://app.smileback.io/api/docs/  (token via Authorization: Token <key>)

const BASE = process.env.SMILEBACK_BASE_URL || 'https://app.smileback.io/api/v3';
const TOKEN = process.env.SMILEBACK_API_TOKEN || '';

export function isSmileBackConfigured() {
    return Boolean(TOKEN);
}

export async function sbFetch<T = unknown>(path: string, query?: Record<string, string | number>) {
    if (!isSmileBackConfigured()) throw new Error('SMILEBACK_API_TOKEN not set');
    const url = new URL(`${BASE}${path}`);
    if (query) for (const [k, v] of Object.entries(query)) url.searchParams.append(k, String(v));
    const res = await fetch(url.toString(), {
        headers: {
            Authorization: `Token ${TOKEN}`,
            Accept: 'application/json',
        },
        cache: 'no-store',
    });
    if (!res.ok) throw new Error(`SmileBack ${res.status} on ${path}: ${await res.text()}`);
    return (await res.json()) as T;
}

export interface SbReview {
    id: number;
    rating: 'positive' | 'neutral' | 'negative';
    created: string;
    comment?: string;
    reviewer?: { name?: string; email?: string };
    ticket_external_id?: string;
}

export async function fetchRecentReviews(days = 30) {
    const since = new Date(Date.now() - days * 86_400_000).toISOString();
    return sbFetch<{ results: SbReview[] }>('/reviews/', { created__gte: since, page_size: 200 });
}
