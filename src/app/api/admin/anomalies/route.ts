import { NextResponse } from 'next/server';
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

export type Anomaly = {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    category: 'sla' | 'tech_kpi' | 'stalled' | 'ams' | 'outreach';
    title: string;
    detail: string;
    metric?: string;
    href?: string;
};

// Tunable defaults — can move to a settings table later.
const DAILY_CLOSE_TARGET = 20;          // tickets closed per tech / day
const STALLED_AGE_DAYS = 7;             // open ticket older than this counts as stalled
const SLA_RISK_MIN = 60;                // ticket at risk if < this many minutes to breach

const splitResources = (s: string | null) =>
    (s ?? '').split(/[,;]+/).map(t => t.trim()).filter(Boolean);

export async function GET() {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const out: Anomaly[] = [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

    // ── 1. SLA breaches & risk on open tickets ────────────────────────────
    try {
        const { data: tickets } = await (adminSupabase as any)
            .from('cw_tickets')
            .select('id, summary, status_name, board_name, assigned_resource, minutes_until_breach, sla_status, date_entered, date_closed, age_days, priority_name')
            .is('date_closed', null);

        const all = (tickets ?? []) as any[];
        const breached = all.filter(t => (t.minutes_until_breach ?? 0) < 0
            || (t.sla_status ?? '').toLowerCase() === 'breached'
            || (t.sla_status ?? '').toLowerCase() === 'violated');
        const atRisk = all.filter(t => (t.minutes_until_breach ?? Infinity) >= 0
            && (t.minutes_until_breach ?? Infinity) < SLA_RISK_MIN
            && (t.sla_status ?? '').toLowerCase() !== 'met');

        if (breached.length > 0) {
            out.push({
                id: 'sla-breach',
                severity: 'critical',
                category: 'sla',
                title: `${breached.length} SLA${breached.length === 1 ? '' : 's'} breached`,
                detail: breached.slice(0, 3).map(t =>
                    `#${t.id} ${(t.summary ?? '').slice(0, 50)} — ${t.assigned_resource ?? 'unassigned'}`
                ).join(' · '),
                metric: `${breached.length} open`,
                href: '/admin/service-kpi',
            });
        }
        if (atRisk.length > 0) {
            out.push({
                id: 'sla-risk',
                severity: 'warning',
                category: 'sla',
                title: `${atRisk.length} ticket${atRisk.length === 1 ? '' : 's'} approaching SLA`,
                detail: `Less than ${SLA_RISK_MIN} min to breach. ${atRisk.slice(0, 3).map(t => `#${t.id} ${t.assigned_resource ?? '—'}`).join(' · ')}`,
                metric: `<${SLA_RISK_MIN}m`,
                href: '/admin/service-kpi',
            });
        }

        // Stalled — open longer than threshold
        const stalled = all.filter(t => (t.age_days ?? 0) > STALLED_AGE_DAYS);
        if (stalled.length > 0) {
            // Group by assigned tech for the detail string
            const byTech = new Map<string, number>();
            stalled.forEach(t => {
                const tech = t.assigned_resource || 'Unassigned';
                byTech.set(tech, (byTech.get(tech) ?? 0) + 1);
            });
            const top = Array.from(byTech.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3);
            out.push({
                id: 'stalled',
                severity: stalled.length > 10 ? 'critical' : 'warning',
                category: 'stalled',
                title: `${stalled.length} stalled ticket${stalled.length === 1 ? '' : 's'} (>${STALLED_AGE_DAYS}d open)`,
                detail: top.map(([t, n]) => `${t}: ${n}`).join(' · '),
                metric: `${stalled.length} stalled`,
                href: '/admin/service-kpi',
            });
        }
    } catch (e) {
        // Tickets table might not be hooked up yet — silent.
    }

    // ── 2. Tech KPI miss (closed_by_me / day < DAILY_CLOSE_TARGET) ─────────
    try {
        const { data: tickets7d } = await (adminSupabase as any)
            .from('cw_tickets')
            .select('id, assigned_resource, resources, date_entered, date_closed')
            .or(`date_entered.gte.${sevenDaysAgo},date_closed.gte.${sevenDaysAgo}`);

        const closedByTech = new Map<string, number>();
        for (const t of (tickets7d ?? []) as any[]) {
            const closedMs = t.date_closed ? new Date(t.date_closed).getTime() : 0;
            if (!closedMs || closedMs < Date.now() - 7 * 86_400_000) continue;
            const tech = (t.assigned_resource ?? '').trim();
            if (!tech) continue;
            closedByTech.set(tech, (closedByTech.get(tech) ?? 0) + 1);
        }

        const sevenDayTarget = DAILY_CLOSE_TARGET * 7;
        const underperformers: { tech: string; closed: number; pct: number }[] = [];
        for (const [tech, closed] of closedByTech.entries()) {
            const pct = Math.round((closed / sevenDayTarget) * 100);
            if (closed < sevenDayTarget) {
                underperformers.push({ tech, closed, pct });
            }
        }
        underperformers.sort((a, b) => a.closed - b.closed);

        // Only flag the worst — top 3 by gap
        const flagged = underperformers.slice(0, 3);
        if (flagged.length > 0) {
            out.push({
                id: 'tech-kpi-miss',
                severity: flagged[0].pct < 50 ? 'critical' : 'warning',
                category: 'tech_kpi',
                title: `${flagged.length} tech${flagged.length === 1 ? '' : 's'} below ${DAILY_CLOSE_TARGET}/day target`,
                detail: flagged.map(f => `${f.tech}: ${f.closed}/${sevenDayTarget} (${f.pct}%)`).join(' · '),
                metric: `${flagged[0].pct}%`,
                href: '/admin/service-kpi',
            });
        }
    } catch (e) {
        // ignore
    }

    // ── 3. AMS license overage (clients over contract) ───────────────────
    try {
        const { data: amsClients } = await (adminSupabase as any)
            .from('ams_clients')
            .select('id, company_name, monthly_amount, users_contracted, price_per_user, ams_user_snapshots(basic_licensed_users)');

        let totalUncollected = 0;
        const overagers: { name: string; delta: number; mrr: number }[] = [];
        for (const c of (amsClients ?? []) as any[]) {
            const snap = Array.isArray(c.ams_user_snapshots) ? c.ams_user_snapshots[0] : null;
            const actual = snap?.basic_licensed_users ?? 0;
            const contracted = c.users_contracted || 0;
            const monthly = parseFloat(c.monthly_amount) || 0;
            const ppu = parseFloat(c.price_per_user) || (contracted > 0 && monthly > 0 ? monthly / contracted : 0);
            const delta = actual - contracted;
            if (delta > 0 && ppu > 0) {
                const mrr = delta * ppu;
                totalUncollected += mrr;
                overagers.push({ name: c.company_name || '—', delta, mrr });
            }
        }
        overagers.sort((a, b) => b.mrr - a.mrr);
        if (totalUncollected > 0) {
            out.push({
                id: 'ams-uncollected',
                severity: totalUncollected >= 2000 ? 'critical' : 'warning',
                category: 'ams',
                title: `${overagers.length} AMS client${overagers.length === 1 ? '' : 's'} over contract`,
                detail: overagers.slice(0, 3).map(o => `${o.name}: +${o.delta} seats`).join(' · '),
                metric: `$${Math.round(totalUncollected).toLocaleString()}/mo`,
                href: '/admin/ams',
            });
        }
    } catch (e) {
        // ignore
    }

    // ── 4. Outreach: large pending-review queue ──────────────────────────
    try {
        const { data: pending } = await (adminSupabase as any)
            .from('outreach_leads')
            .select('expert_id', { count: 'exact', head: true })
            .eq('approval_status', 'pending_review');
        // head:true returns no rows but a count via response headers — supabase-js returns count on data:null
        // Fall back to a length-based query.
        const { count } = await (adminSupabase as any)
            .from('outreach_leads')
            .select('id', { count: 'exact', head: true })
            .eq('approval_status', 'pending_review');

        if ((count ?? 0) > 50) {
            out.push({
                id: 'icebreaker-backlog',
                severity: (count ?? 0) > 200 ? 'warning' : 'info',
                category: 'outreach',
                title: `${count} icebreakers awaiting expert approval`,
                detail: 'Drafts queued by the agents are stacking up. Sweep through approvals to keep send velocity steady.',
                metric: String(count),
                href: '/admin/outreach/experts',
            });
        }
    } catch (e) {
        // ignore
    }

    // Sort: critical first, then warning, then info
    const order = { critical: 0, warning: 1, info: 2 };
    out.sort((a, b) => order[a.severity] - order[b.severity]);

    return NextResponse.json({
        anomalies: out,
        config: {
            daily_close_target: DAILY_CLOSE_TARGET,
            stalled_age_days: STALLED_AGE_DAYS,
            sla_risk_min: SLA_RISK_MIN,
        },
    });
}
