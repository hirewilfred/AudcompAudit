import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const APIFY_API_KEY = process.env.APIFY_API_KEY!;
// Apollo.io People Leads Scraper — reliable, actively maintained
const ACTOR_ID = 'coladeu~apollo-people-leads-scraper';

export async function POST(req: NextRequest) {
    try {
        const { campaign_id, limit = 50 } = await req.json();

        if (!campaign_id) {
            return NextResponse.json({ error: 'campaign_id is required.' }, { status: 400 });
        }

        const supabase = await createClient();

        // Load campaign ICP config
        const { data: campaign, error: campErr } = await (supabase.from('outreach_campaigns') as any)
            .select('id, name, icp_config')
            .eq('id', campaign_id)
            .single();

        if (campErr || !campaign) {
            return NextResponse.json({ error: 'Campaign not found.' }, { status: 404 });
        }

        const icp = campaign.icp_config || {};

        // Build Apollo search input from ICP config
        const actorInput = {
            searchUrl: buildApolloSearchUrl(icp),
            maxResults: Math.min(limit, 1000),
        };

        // Trigger Apify actor run (synchronous with timeout for up to 300s)
        const runRes = await fetch(
            `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${APIFY_API_KEY}&timeout=300&memory=1024`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(actorInput),
            }
        );

        if (!runRes.ok) {
            const text = await runRes.text();
            return NextResponse.json({ error: `Apify error: ${text}` }, { status: 502 });
        }

        const items: any[] = await runRes.json();

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ inserted: 0, message: 'No results from scraper.' });
        }

        // Map Apify output → outreach_leads rows
        const leads = items.map((item: any) => mapApolloItem(item, campaign_id));

        // Upsert on email to avoid dupes within campaign
        const { error: insertErr } = await (supabase.from('outreach_leads') as any)
            .upsert(leads, { onConflict: 'campaign_id,contact_email', ignoreDuplicates: true });

        if (insertErr) {
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }

        // Log agent event
        await (supabase.from('outreach_agent_events') as any).insert({
            campaign_id,
            agent_id: 'apify-scraper',
            agent_display_name: 'Apify Apollo Scraper',
            event_type: 'scrape_completed',
            summary: `Scraped ${leads.length} leads from Apollo.io`,
            details: { actor_id: ACTOR_ID, icp, result_count: leads.length },
            status: 'success',
        });

        return NextResponse.json({ inserted: leads.length });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

function buildApolloSearchUrl(icp: Record<string, string>): string {
    const base = 'https://app.apollo.io/#/people';
    const params = new URLSearchParams();

    if (icp.title_targets) {
        icp.title_targets.split(',').forEach((t: string) => {
            params.append('personTitles[]', t.trim());
        });
    }
    if (icp.industries) {
        icp.industries.split(',').forEach((ind: string) => {
            params.append('organizationIndustryTagValues[]', ind.trim());
        });
    }
    if (icp.geography) {
        icp.geography.split(',').forEach((loc: string) => {
            params.append('personLocations[]', loc.trim());
        });
    }
    if (icp.company_size) {
        // Apollo uses ranges like "1,10" — map common formats
        const sizeMap: Record<string, string> = {
            '1-10': '1,10',
            '11-50': '11,50',
            '20-200': '11,200',
            '51-200': '51,200',
            '201-500': '201,500',
            '501-1000': '501,1000',
            '1001-5000': '1001,5000',
        };
        const range = sizeMap[icp.company_size.trim()] || icp.company_size.trim();
        params.append('organizationNumEmployeesRanges[]', range);
    }

    return `${base}?${params.toString()}`;
}

function mapApolloItem(item: any, campaign_id: string) {
    return {
        campaign_id,
        company_name: item.organization?.name || item.company || null,
        contact_name: item.name || [item.first_name, item.last_name].filter(Boolean).join(' ') || null,
        contact_email: item.email || null,
        contact_title: item.title || null,
        contact_linkedin: item.linkedin_url || null,
        company_domain: item.organization?.primary_domain || item.organization?.website_url || null,
        company_industry: item.organization?.industry || null,
        company_size: item.organization?.estimated_num_employees?.toString() || null,
        company_location: item.city || item.state || item.country || null,
        status: 'researched',
        source: 'apify-apollo',
        researched_at: new Date().toISOString(),
    };
}
