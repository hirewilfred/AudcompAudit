import { OutreachProvider, PushResult, ProviderStats, PushLead } from './types';
import { getIntegrationKey } from '../integrations';

const BASE = 'https://api.instantly.ai/api/v2';

async function authedFetch(path: string, init: RequestInit = {}) {
    const key = await getIntegrationKey({ provider: 'instantly' });
    if (!key) throw new Error('No active Instantly integration in the vault');
    const headers = {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
    };
    return fetch(`${BASE}${path}`, { ...init, headers });
}

export const instantlyAdapter: OutreachProvider = {
    name: 'instantly',

    async pushLeads({ providerCampaignId, campaignName, senderEmail, leads }) {
        const result: PushResult = { pushed: 0, skipped: 0, failed: 0, errors: [] };

        // Create a campaign if we don't have one yet.
        let campaignId = providerCampaignId;
        if (!campaignId) {
            const res = await authedFetch('/campaigns', {
                method: 'POST',
                body: JSON.stringify({
                    name: campaignName ?? 'Audcomp Outreach',
                    email_list: senderEmail ? [senderEmail] : undefined,
                }),
            });
            if (!res.ok) {
                const text = await res.text();
                throw new Error(`Instantly campaign create failed: ${text}`);
            }
            const data = await res.json();
            campaignId = data.id;
        }
        result.providerCampaignId = campaignId;

        // Bulk add leads — Instantly accepts batch via /leads.
        const payload = leads.map((l: PushLead) => ({
            email: l.email,
            first_name: l.first_name ?? '',
            last_name: l.last_name ?? '',
            company_name: l.company ?? '',
            personalization: l.custom?.icebreaker ?? '',
            campaign: campaignId,
        }));

        const res = await authedFetch('/leads', {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        if (!res.ok) {
            const text = await res.text();
            // Treat the whole batch as failed if the endpoint rejects.
            leads.forEach(l => result.errors.push({ leadId: l.id, error: text.slice(0, 200) }));
            result.failed = leads.length;
            return result;
        }

        const data = await res.json();
        // Instantly responds with per-row created/skipped counts in v2.
        result.pushed = data.created ?? leads.length;
        result.skipped = data.skipped ?? 0;
        result.failed = data.failed ?? 0;
        return result;
    },

    async pauseCampaign(id) {
        const res = await authedFetch(`/campaigns/${id}/pause`, { method: 'POST' });
        if (!res.ok) throw new Error(await res.text());
    },

    async resumeCampaign(id) {
        const res = await authedFetch(`/campaigns/${id}/activate`, { method: 'POST' });
        if (!res.ok) throw new Error(await res.text());
    },

    async fetchStats(id) {
        const res = await authedFetch(`/campaigns/${id}/analytics`);
        if (!res.ok) {
            return { contacted: 0, opened: 0, replied: 0, booked: 0, bounced: 0 };
        }
        const a = await res.json();
        return {
            contacted: a.contacted ?? a.sent ?? 0,
            opened:    a.opened ?? 0,
            replied:   a.replied ?? 0,
            booked:    a.booked ?? a.meetings ?? 0,
            bounced:   a.bounced ?? 0,
        };
    },

    async testConnection() {
        try {
            const res = await authedFetch('/campaigns?limit=1');
            if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
            return { ok: true };
        } catch (e: any) {
            return { ok: false, error: e.message };
        }
    },
};
