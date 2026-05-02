import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getProvider, PushLead } from '@/lib/outreach/providers';

const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false as const, status: 401 };
    const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', session.user.id).single() as any;
    if (!profile?.is_admin) return { ok: false as const, status: 403 };
    return { ok: true as const };
}

// POST /api/outreach/campaigns/:id/push
// Body: { leadIds?: string[]; onlyApproved?: boolean }
// Pushes the campaign's leads to its provider (currently Instantly).
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const { id: campaignId } = await ctx.params;
    const body = await req.json().catch(() => ({} as any));
    const onlyApproved: boolean = body.onlyApproved ?? true;
    const leadIds: string[] | undefined = Array.isArray(body.leadIds) ? body.leadIds : undefined;

    // Load campaign + expert + leads
    const { data: campaign, error: campErr } = await (adminSupabase as any)
        .from('outreach_campaigns')
        .select('id, name, channel, expert_id, instantly_campaign_id, daily_send_cap')
        .eq('id', campaignId)
        .maybeSingle();
    if (campErr || !campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    let leadsQuery = (adminSupabase as any).from('outreach_leads')
        .select('id, contact_email, contact_name, contact_title, company_name, linkedin_url, approval_status')
        .eq('campaign_id', campaignId)
        .is('last_message_at', null); // only push leads we haven't sent to yet

    if (leadIds?.length) leadsQuery = leadsQuery.in('id', leadIds);
    if (onlyApproved) leadsQuery = leadsQuery.eq('approval_status', 'approved');

    const { data: leads, error: leadsErr } = await leadsQuery;
    if (leadsErr) return NextResponse.json({ error: leadsErr.message }, { status: 500 });
    if (!leads?.length) {
        return NextResponse.json({ pushed: 0, skipped: 0, failed: 0, note: 'No matching leads' });
    }

    // Resolve sender email — per-expert if available
    let senderEmail: string | undefined;
    if (campaign.expert_id) {
        const { data: expert } = await (adminSupabase as any)
            .from('experts').select('email').eq('id', campaign.expert_id).maybeSingle();
        senderEmail = expert?.email ?? undefined;
    }

    const adapter = getProvider('instantly');

    // Map DB rows -> adapter shape
    const pushPayload: PushLead[] = leads.map((l: any) => {
        const [first, ...rest] = (l.contact_name ?? '').trim().split(/\s+/);
        return {
            id: l.id,
            email: l.contact_email,
            first_name: first || null,
            last_name: rest.join(' ') || null,
            company: l.company_name,
            title: l.contact_title,
            linkedin_url: l.linkedin_url,
        };
    });

    let result;
    try {
        result = await adapter.pushLeads({
            providerCampaignId: campaign.instantly_campaign_id ?? undefined,
            campaignName: campaign.name,
            senderEmail,
            leads: pushPayload,
        });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 502 });
    }

    // Persist provider campaign id if newly created
    if (result.providerCampaignId && !campaign.instantly_campaign_id) {
        await (adminSupabase as any).from('outreach_campaigns')
            .update({ instantly_campaign_id: result.providerCampaignId })
            .eq('id', campaignId);
    }

    // Mark pushed leads as 'sent' + stamp last_message_at
    const successIds = pushPayload
        .filter(p => !result.errors.find(e => e.leadId === p.id))
        .map(p => p.id);

    if (successIds.length) {
        await (adminSupabase as any).from('outreach_leads')
            .update({
                approval_status: 'sent',
                last_message_at: new Date().toISOString(),
            })
            .in('id', successIds);
    }

    // Bump campaign stats
    await (adminSupabase as any).from('outreach_campaigns')
        .update({ stats_contacted: (((leads as any).stats_contacted ?? 0) + result.pushed) })
        .eq('id', campaignId);

    return NextResponse.json(result);
}
