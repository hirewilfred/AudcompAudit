// PhantomBuster adapter — launches LinkedIn phantoms with the corporate API key
// and a per-expert LinkedIn `li_at` cookie pulled from the integrations vault.

import { getIntegrationKey } from '../integrations';

const BASE = 'https://api.phantombuster.com/api/v2';

const DEFAULT_PHANTOMS = {
    connect:        'LinkedIn Network Booster',
    visit:          'LinkedIn Profile Visitor',
    message:        'LinkedIn Message Sender',
    post_engager:   'LinkedIn Post Engager',
    auto_commenter: 'LinkedIn Auto Commenter',
} as const;

export type PhantomKind = keyof typeof DEFAULT_PHANTOMS;

async function pbFetch(path: string, init: RequestInit = {}) {
    const key = await getIntegrationKey({ provider: 'phantombuster' });
    if (!key) throw new Error('No active PhantomBuster integration in the vault');
    return fetch(`${BASE}${path}`, {
        ...init,
        headers: {
            'X-Phantombuster-Key': key,
            'Content-Type': 'application/json',
            ...(init.headers || {}),
        },
    });
}

export interface LaunchArgs {
    phantomId: string;                 // PhantomBuster agent id (set up once in their UI)
    expertId: string;                  // owner — used to fetch per-expert li_at cookie
    profileUrls: string[];             // LinkedIn profile URLs to act on
    message?: string;                  // for connect / message phantoms
    post?: string;                     // for post_engager phantom (post URL)
    extras?: Record<string, any>;
}

/**
 * Launch a phantom against a list of LinkedIn profiles.
 * Returns a PhantomBuster container ID we can poll for completion.
 */
export async function launchPhantom(kind: PhantomKind, args: LaunchArgs): Promise<{ containerId: string }> {
    // Per-expert LinkedIn session cookie (li_at) lives in integrations
    // table with scope='per_expert' and provider='linkedin_oauth'.
    const liAt = await getIntegrationKey({ provider: 'linkedin_oauth', expertId: args.expertId });
    if (!liAt) throw new Error(`Expert ${args.expertId} has no connected LinkedIn cookie`);

    const argument: Record<string, any> = {
        sessionCookie: liAt,
        profileUrls: args.profileUrls,
        ...(args.message ? { message: args.message } : {}),
        ...(args.post ? { postUrl: args.post } : {}),
        ...(args.extras ?? {}),
    };

    const res = await pbFetch(`/agents/launch`, {
        method: 'POST',
        body: JSON.stringify({ id: args.phantomId, argument }),
    });

    if (!res.ok) throw new Error(`PhantomBuster launch failed: ${res.status} ${await res.text()}`);
    const data = await res.json();
    return { containerId: data.containerId ?? data.id ?? '' };
}

export async function fetchContainerOutput(containerId: string): Promise<any> {
    const res = await pbFetch(`/containers/fetch-output?id=${containerId}`);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export const phantombusterAdapter = {
    name: 'phantombuster' as const,
    DEFAULT_PHANTOMS,
    launchPhantom,
    fetchContainerOutput,
    async testConnection() {
        try {
            const res = await pbFetch('/agents/fetch-all');
            if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
            return { ok: true };
        } catch (e: any) {
            return { ok: false, error: e.message };
        }
    },
};
