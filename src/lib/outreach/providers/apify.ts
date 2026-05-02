// Apify adapter — synchronous run + dataset fetch.
// Used by the lead-hunter agent to scrape Apollo, Google Places, LinkedIn search.

import { getIntegrationKey } from '../integrations';

const BASE = 'https://api.apify.com/v2';

async function token() {
    const t = await getIntegrationKey({ provider: 'apify' });
    if (!t) throw new Error('No active Apify integration in the vault');
    return t;
}

export interface ApifyScrapedLead {
    email?: string;
    first_name?: string;
    last_name?: string;
    full_name?: string;
    title?: string;
    company?: string;
    linkedin_url?: string;
    location?: string;
    phone?: string;
    raw: any;
}

const DEFAULT_ACTORS = {
    apollo:        'curious_coder/apollo-io-scraper',
    google_places: 'compass/crawler-google-places',
    linkedin:      'apify/linkedin-people-search',
} as const;

export type ApifySource = keyof typeof DEFAULT_ACTORS;

/**
 * Run an Apify actor synchronously and return a normalized list of leads.
 * Synchronous runs cap at 5 minutes — bigger jobs should switch to async + webhook.
 */
export async function runApifyActor(args: {
    source: ApifySource;
    actorOverride?: string;       // override the default actor id
    input: Record<string, any>;   // shape depends on actor
    timeoutSecs?: number;         // default 300
}): Promise<ApifyScrapedLead[]> {
    const actor = args.actorOverride ?? DEFAULT_ACTORS[args.source];
    const t = await token();
    const url = `${BASE}/acts/${encodeURIComponent(actor)}/run-sync-get-dataset-items?token=${t}&timeout=${args.timeoutSecs ?? 300}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(args.input),
    });

    if (!res.ok) {
        throw new Error(`Apify ${args.source} run failed: ${res.status} ${await res.text()}`);
    }

    const items = (await res.json()) as any[];
    return items.map(raw => normalize(raw, args.source));
}

function normalize(item: any, source: ApifySource): ApifyScrapedLead {
    if (source === 'apollo') {
        return {
            email: item.email,
            first_name: item.first_name,
            last_name: item.last_name,
            full_name: item.name,
            title: item.title,
            company: item.organization?.name ?? item.company_name,
            linkedin_url: item.linkedin_url,
            location: [item.city, item.state, item.country].filter(Boolean).join(', ') || undefined,
            phone: item.phone_numbers?.[0]?.sanitized_number,
            raw: item,
        };
    }
    if (source === 'google_places') {
        return {
            company: item.title ?? item.name,
            phone: item.phone ?? item.phoneUnformatted,
            location: item.address ?? item.fullAddress,
            raw: item,
        };
    }
    if (source === 'linkedin') {
        return {
            full_name: item.fullName ?? `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim(),
            first_name: item.firstName,
            last_name: item.lastName,
            title: item.headline ?? item.title,
            company: item.companyName,
            linkedin_url: item.profileUrl ?? item.url,
            location: item.location,
            raw: item,
        };
    }
    return { raw: item };
}

export const apifyAdapter = {
    name: 'apify' as const,
    runApifyActor,
    async testConnection() {
        try {
            const t = await token();
            const res = await fetch(`${BASE}/users/me?token=${t}`);
            if (!res.ok) return { ok: false, error: await res.text() };
            return { ok: true };
        } catch (e: any) {
            return { ok: false, error: e.message };
        }
    },
};
