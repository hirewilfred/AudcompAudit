import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY!;
const INSTANTLY_BASE = 'https://api.instantly.ai/api/v2';

export async function POST(req: NextRequest) {
    try {
        const { campaign_id, instantly_campaign_id } = await req.json();

        if (!campaign_id || !instantly_campaign_id) {
            return NextResponse.json(
                { error: 'campaign_id and instantly_campaign_id are required.' },
                { status: 400 }
            );
        }

        const supabase = await createClient();

        // Fetch leads that haven't been synced yet (status = researched, no contacted_at)
        const { data: leads, error: leadsErr } = await (supabase.from('outreach_leads') as any)
            .select('id, contact_name, contact_email, contact_title, company_name, company_domain, company_industry, company_location')
            .eq('campaign_id', campaign_id)
            .eq('status', 'researched')
            .is('contacted_at', null)
            .not('contact_email', 'is', null);

        if (leadsErr) {
            return NextResponse.json({ error: leadsErr.message }, { status: 500 });
        }

        if (!leads || leads.length === 0) {
            return NextResponse.json({ synced: 0, message: 'No eligible leads to sync.' });
        }

        // Instantly bulk add accepts up to 1000 at a time
        const chunks = chunkArray(leads, 1000);
        let totalSynced = 0;

        for (const chunk of chunks) {
            const instantlyLeads = chunk.map((lead: any) => {
                const [firstName, ...rest] = (lead.contact_name || '').split(' ');
                return {
                    email: lead.contact_email,
                    first_name: firstName || '',
                    last_name: rest.join(' ') || '',
                    company_name: lead.company_name || '',
                    personalization: lead.contact_title || '',
                    website: lead.company_domain || '',
                    custom_variables: {
                        industry: lead.company_industry || '',
                        location: lead.company_location || '',
                        title: lead.contact_title || '',
                    },
                };
            });

            const res = await fetch(`${INSTANTLY_BASE}/leads/bulk`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${INSTANTLY_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    campaign_id: instantly_campaign_id,
                    leads: instantlyLeads,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                return NextResponse.json({ error: `Instantly sync error: ${text}` }, { status: 502 });
            }

            // Mark leads as contacted in Supabase
            const leadIds = chunk.map((l: any) => l.id);
            await (supabase.from('outreach_leads') as any)
                .update({
                    status: 'contacted',
                    contacted_at: new Date().toISOString(),
                    last_touch_at: new Date().toISOString(),
                })
                .in('id', leadIds);

            totalSynced += chunk.length;
        }

        // Log agent event
        await (supabase.from('outreach_agent_events') as any).insert({
            campaign_id,
            agent_id: 'instantly-sync',
            agent_display_name: 'Instantly Sync',
            event_type: 'leads_synced',
            summary: `Synced ${totalSynced} leads to Instantly campaign`,
            details: { instantly_campaign_id, lead_count: totalSynced },
            status: 'success',
        });

        return NextResponse.json({ synced: totalSynced });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
