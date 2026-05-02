import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

// GET /api/admin/experts/outreach
//   → list of every expert with rolled-up outreach KPIs
// GET /api/admin/experts/outreach?expertId=<uuid>
//   → single-expert detail (campaigns, leads, landing-page captures, integrations)
export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.ok ? '' : 'Forbidden' }, { status: auth.status });

    const expertId = new URL(req.url).searchParams.get('expertId');

    if (expertId) {
        // ── Single-expert detail ──────────────────────────────────────────
        const [expertRes, campaignsRes, leadsRes, landingRes, integrationsRes] = await Promise.all([
            (adminSupabase as any).from('experts')
                .select('id, full_name, email, photo_url, bookings_url, title, bio')
                .eq('id', expertId).maybeSingle(),
            (adminSupabase as any).from('outreach_campaigns')
                .select('id, name, status, channel, stats_researched, stats_contacted, stats_replied, stats_booked, instantly_campaign_id, phantombuster_campaign_id, landing_page_slug, daily_send_cap, updated_at, created_at')
                .eq('expert_id', expertId)
                .order('updated_at', { ascending: false }),
            (adminSupabase as any).from('outreach_leads')
                .select('id, contact_name, contact_email, contact_title, company_name, linkedin_url, source, approval_status, last_message_at, replied_at, booked_at, created_at, campaign_id')
                .eq('expert_id', expertId)
                .order('created_at', { ascending: false })
                .limit(200),
            (adminSupabase as any).from('landing_page_submissions')
                .select('id, landing_page_slug, email, full_name, organization, phone, captured_at, utm_source, utm_campaign')
                .eq('assigned_expert_id', expertId)
                .order('captured_at', { ascending: false })
                .limit(50),
            (adminSupabase as any).from('integrations')
                .select('id, provider, label, is_active, last4, last_test_ok, rotated_at')
                .eq('expert_id', expertId)
                .eq('scope', 'per_expert'),
        ]);

        if (!expertRes.data) {
            return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
        }

        const leads = leadsRes.data ?? [];
        const inbox = leads.filter((l: any) => l.replied_at && !l.booked_at);
        const icebreakerQueue = leads.filter((l: any) => l.approval_status === 'pending_review');

        const totals = {
            campaigns_active: (campaignsRes.data ?? []).filter((c: any) => c.status === 'active').length,
            campaigns_total: (campaignsRes.data ?? []).length,
            leads_total: leads.length,
            leads_replied: leads.filter((l: any) => l.replied_at).length,
            leads_booked: leads.filter((l: any) => l.booked_at).length,
            inbox_count: inbox.length,
            queue_count: icebreakerQueue.length,
            landing_captures_30d: (landingRes.data ?? []).filter((s: any) =>
                Date.now() - new Date(s.captured_at).getTime() < 30 * 24 * 60 * 60 * 1000
            ).length,
        };

        return NextResponse.json({
            expert: expertRes.data,
            campaigns: campaignsRes.data ?? [],
            leads,
            inbox,
            icebreakerQueue,
            landingCaptures: landingRes.data ?? [],
            integrations: integrationsRes.data ?? [],
            totals,
        });
    }

    // ── All-experts overview ─────────────────────────────────────────────
    const [expertsRes, campaignsRes, leadsRes, landingRes] = await Promise.all([
        (adminSupabase as any).from('experts')
            .select('id, full_name, email, photo_url, title')
            .order('full_name', { ascending: true }),
        (adminSupabase as any).from('outreach_campaigns')
            .select('id, expert_id, status, stats_contacted, stats_replied, stats_booked'),
        (adminSupabase as any).from('outreach_leads')
            .select('expert_id, replied_at, booked_at, approval_status'),
        (adminSupabase as any).from('landing_page_submissions')
            .select('assigned_expert_id, captured_at'),
    ]);

    const experts = expertsRes.data ?? [];
    const campaigns = campaignsRes.data ?? [];
    const leads = leadsRes.data ?? [];
    const landings = landingRes.data ?? [];

    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const rows = experts.map((e: any) => {
        const expertCampaigns = campaigns.filter((c: any) => c.expert_id === e.id);
        const expertLeads = leads.filter((l: any) => l.expert_id === e.id);
        const expertLandings = landings.filter((s: any) =>
            s.assigned_expert_id === e.id && new Date(s.captured_at).getTime() > sevenDaysAgo
        );
        return {
            ...e,
            campaigns_active: expertCampaigns.filter((c: any) => c.status === 'active').length,
            campaigns_total: expertCampaigns.length,
            leads_total: expertLeads.length,
            leads_replied: expertLeads.filter((l: any) => l.replied_at).length,
            leads_booked: expertLeads.filter((l: any) => l.booked_at).length,
            queue_count: expertLeads.filter((l: any) => l.approval_status === 'pending_review').length,
            landings_7d: expertLandings.length,
        };
    });

    return NextResponse.json({ experts: rows });
}
