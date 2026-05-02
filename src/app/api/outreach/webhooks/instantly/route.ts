import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Configure in Instantly: Settings → Integrations → Webhooks → Add
// URL: https://<host>/api/outreach/webhooks/instantly
// Events to subscribe: email_sent, email_opened, email_replied, lead_interested,
// meeting_booked, lead_unsubscribed, lead_bounced.
//
// Optional shared secret: set INSTANTLY_WEBHOOK_SECRET in env and the matching
// header in Instantly. We bail early if it doesn't match.
export async function POST(req: NextRequest) {
    const required = process.env.INSTANTLY_WEBHOOK_SECRET;
    if (required) {
        const got = req.headers.get('x-webhook-secret') ?? req.headers.get('x-instantly-secret');
        if (got !== required) {
            return NextResponse.json({ error: 'Bad secret' }, { status: 401 });
        }
    }

    let payload: any;
    try { payload = await req.json(); } catch { return NextResponse.json({ ok: true }); }

    const email = (payload.lead?.email || payload.email || '').toLowerCase();
    const eventType = payload.event_type || payload.type || payload.event;
    const providerCampaignId = payload.campaign?.id || payload.campaign_id || null;

    if (!email || !eventType) {
        return NextResponse.json({ ok: true, ignored: 'malformed' });
    }

    const now = new Date().toISOString();

    // Locate the matching lead — prefer provider-campaign-scoped match, fall back to email.
    let leadQuery = (adminSupabase as any).from('outreach_leads')
        .select('id, campaign_id')
        .eq('contact_email', email);

    if (providerCampaignId) {
        const { data: matchedCampaign } = await (adminSupabase as any).from('outreach_campaigns')
            .select('id').eq('instantly_campaign_id', providerCampaignId).maybeSingle();
        if (matchedCampaign?.id) {
            leadQuery = leadQuery.eq('campaign_id', matchedCampaign.id);
        }
    }

    const { data: leads } = await leadQuery.limit(5);
    if (!leads?.length) return NextResponse.json({ ok: true, ignored: 'no-match' });

    // What to update for each event type — uses the slice 1 columns directly.
    const update: Record<string, any> = { last_message_at: now };
    switch (eventType) {
        case 'email_sent':
            update.approval_status = 'sent';
            break;
        case 'email_opened':
            // no dedicated column; just bump last_message_at
            break;
        case 'email_replied':
        case 'lead_interested':
            update.replied_at = now;
            break;
        case 'meeting_booked':
            update.replied_at = now;
            update.booked_at = now;
            break;
        case 'lead_unsubscribed':
        case 'lead_bounced':
            update.approval_status = 'declined';
            break;
        default:
            return NextResponse.json({ ok: true, ignored: `unknown-event:${eventType}` });
    }

    const ids = leads.map((l: any) => l.id);
    await (adminSupabase as any).from('outreach_leads').update(update).in('id', ids);

    // Bump campaign-level counters for at-a-glance dashboards.
    const campaignIds = Array.from(new Set(leads.map((l: any) => l.campaign_id).filter(Boolean)));
    for (const cid of campaignIds) {
        if (eventType === 'email_replied' || eventType === 'lead_interested') {
            await (adminSupabase as any).rpc('increment_campaign_stat', { p_campaign_id: cid, p_field: 'stats_replied' }).catch(() => {});
        }
        if (eventType === 'meeting_booked') {
            await (adminSupabase as any).rpc('increment_campaign_stat', { p_campaign_id: cid, p_field: 'stats_booked' }).catch(() => {});
        }
    }

    return NextResponse.json({ ok: true, leads_updated: ids.length });
}
