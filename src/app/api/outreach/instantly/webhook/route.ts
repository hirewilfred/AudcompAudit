import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Instantly webhook — receives real-time status events and updates outreach_leads
// Configure this endpoint in Instantly: Settings → Integrations → Webhooks
// URL: https://yourdomain.com/api/outreach/instantly/webhook

export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const supabase = await createClient();

        const email = payload.lead?.email || payload.email;
        const eventType = payload.event_type || payload.type;

        if (!email || !eventType) {
            return NextResponse.json({ ok: true }); // Ignore malformed events
        }

        const now = new Date().toISOString();

        // Map Instantly event types → lead status + timestamp fields
        const statusMap: Record<string, { status: string; timestampField: string }> = {
            'email_sent': { status: 'contacted', timestampField: 'contacted_at' },
            'email_opened': { status: 'contacted', timestampField: 'last_touch_at' },
            'email_replied': { status: 'replied', timestampField: 'replied_at' },
            'lead_interested': { status: 'interested', timestampField: 'interested_at' },
            'meeting_booked': { status: 'booked', timestampField: 'booked_at' },
            'lead_unsubscribed': { status: 'disqualified', timestampField: 'last_touch_at' },
            'lead_bounced': { status: 'disqualified', timestampField: 'last_touch_at' },
        };

        const mapped = statusMap[eventType];

        if (mapped) {
            const update: Record<string, string> = {
                status: mapped.status,
                last_touch_at: now,
                [mapped.timestampField]: now,
            };

            await (supabase.from('outreach_leads') as any)
                .update(update)
                .eq('contact_email', email);
        }

        // Log all events regardless
        await (supabase.from('outreach_agent_events') as any).insert({
            agent_id: 'instantly-webhook',
            agent_display_name: 'Instantly Webhook',
            event_type: eventType,
            summary: `${eventType} — ${email}`,
            details: payload,
            status: 'success',
            occurred_at: now,
        });

        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
