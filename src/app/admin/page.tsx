'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import {
    Users, ArrowRight, Loader2, ShieldAlert, Activity,
    ClipboardList, RotateCcw, DollarSign, Megaphone,
    Building2, ChevronRight, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const fmtMoney = (n: number) =>
    n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

interface UncollectedRow {
    id: string;
    company_name: string;
    contracted: number;
    actual: number;
    delta: number;
    pricePerUser: number;
    missingMRR: number;
}

interface CampaignRow {
    id: string;
    name: string;
    status: string;
    stats_researched: number;
    stats_contacted: number;
    stats_replied: number;
    stats_booked: number;
    client_name: string | null;
    updated_at: string | null;
}

interface AuditRow {
    user_id: string;
    full_name: string | null;
    email: string | null;
    organization: string | null;
    overall_score: number | null;
    created_at: string;
    expert_name: string | null;
}

export default function AdminCommandCenter() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const [stats, setStats] = useState({
        totalProfiles: 0,
        totalAudits: 0,
        totalMRR: 0,
        uncollectedMRR: 0,
        activeCampaigns: 0,
        newAudits7d: 0,
    });
    const [uncollected, setUncollected] = useState<UncollectedRow[]>([]);
    const [activeCampaigns, setActiveCampaigns] = useState<CampaignRow[]>([]);
    const [recentAudits, setRecentAudits] = useState<AuditRow[]>([]);

    const [resetting, setResetting] = useState(false);
    const handleResetMyAudit = async () => {
        const ok = window.confirm(
            'Reset YOUR audit?\n\nThis will delete your audit_scores + ai_advisor_reports and ' +
            'flip has_completed_audit to false so you can retake the survey. Continue?'
        );
        if (!ok) return;
        setResetting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/auth'); return; }
            const uid = session.user.id;
            await Promise.all([
                supabase.from('audit_scores').delete().eq('user_id', uid),
                (supabase.from('ai_advisor_reports') as any).delete().eq('user_id', uid),
                (supabase.from('profiles') as any).update({ has_completed_audit: false }).eq('id', uid),
            ]);
            router.push('/survey');
        } catch (err) {
            console.error('Reset failed', err);
            alert('Reset failed — see console.');
            setResetting(false);
        }
    };

    useEffect(() => {
        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { router.push('/auth'); return; }

                const { data: profile } = await supabase
                    .from('profiles').select('is_admin').eq('id', session.user.id).single() as any;
                if (!profile?.is_admin) { setIsAdmin(false); return; }
                setIsAdmin(true);

                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

                const [
                    profilesCountRes,
                    auditsCountRes,
                    new7dRes,
                    amsRes,
                    campaignsRes,
                    recentAuditsRes,
                    expertsRes,
                ] = await Promise.all([
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('audit_scores').select('*', { count: 'exact', head: true }),
                    supabase.from('audit_scores').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
                    (supabase.from('ams_clients') as any)
                        .select('id, company_name, monthly_amount, users_contracted, price_per_user, ams_user_snapshots(basic_licensed_users)'),
                    (supabase.from('outreach_campaigns') as any)
                        .select('id, name, status, stats_researched, stats_contacted, stats_replied, stats_booked, updated_at, ams_clients(company_name)')
                        .eq('status', 'active')
                        .order('updated_at', { ascending: false })
                        .limit(8),
                    (supabase.from('audit_scores') as any)
                        .select('user_id, overall_score, created_at')
                        .order('created_at', { ascending: false })
                        .limit(20),
                    supabase.from('experts').select('id, full_name'),
                ]);

                // ── AMS uncollected revenue ──────────────────────────────
                const amsClients = (amsRes.data || []) as any[];
                let totalMRR = 0;
                let uncollectedTotal = 0;
                const overageRows: UncollectedRow[] = [];

                for (const c of amsClients) {
                    const monthly = parseFloat(c.monthly_amount) || 0;
                    totalMRR += monthly;
                    const snap = Array.isArray(c.ams_user_snapshots) ? c.ams_user_snapshots[0] : null;
                    const actual = snap?.basic_licensed_users ?? 0;
                    const contracted = c.users_contracted || 0;
                    const ppu = parseFloat(c.price_per_user) ||
                        (contracted > 0 && monthly > 0 ? monthly / contracted : 0);
                    const delta = actual - contracted;
                    if (delta > 0 && ppu > 0) {
                        const missingMRR = delta * ppu;
                        uncollectedTotal += missingMRR;
                        overageRows.push({
                            id: c.id,
                            company_name: c.company_name || '—',
                            contracted, actual, delta, pricePerUser: ppu, missingMRR,
                        });
                    }
                }
                overageRows.sort((a, b) => b.missingMRR - a.missingMRR);

                // ── Recent audits — hydrate user + expert info ───────────
                const auditRows = (recentAuditsRes.data || []) as any[];
                const userIds = Array.from(new Set(auditRows.map(a => a.user_id))).filter(Boolean);
                let profileMap = new Map<string, any>();
                if (userIds.length) {
                    const { data: profs } = await supabase
                        .from('profiles')
                        .select('id, full_name, email, organization, assigned_expert_id')
                        .in('id', userIds);
                    (profs || []).forEach((p: any) => profileMap.set(p.id, p));
                }
                const expertMap = new Map<string, string>();
                (expertsRes.data || []).forEach((e: any) => expertMap.set(e.id, e.full_name));

                const hydratedAudits: AuditRow[] = auditRows.map(a => {
                    const p = profileMap.get(a.user_id) || {};
                    return {
                        user_id: a.user_id,
                        full_name: p.full_name || null,
                        email: p.email || null,
                        organization: p.organization || null,
                        overall_score: a.overall_score ?? null,
                        created_at: a.created_at,
                        expert_name: p.assigned_expert_id ? (expertMap.get(p.assigned_expert_id) || null) : null,
                    };
                });

                // ── Outreach ──────────────────────────────────────────────
                const camps: CampaignRow[] = ((campaignsRes.data || []) as any[]).map(c => ({
                    id: c.id,
                    name: c.name || 'Untitled campaign',
                    status: c.status,
                    stats_researched: c.stats_researched || 0,
                    stats_contacted: c.stats_contacted || 0,
                    stats_replied: c.stats_replied || 0,
                    stats_booked: c.stats_booked || 0,
                    client_name: c.ams_clients?.company_name || null,
                    updated_at: c.updated_at,
                }));

                setUncollected(overageRows.slice(0, 6));
                setActiveCampaigns(camps);
                setRecentAudits(hydratedAudits.slice(0, 10));
                setStats({
                    totalProfiles: profilesCountRes.count || 0,
                    totalAudits: auditsCountRes.count || 0,
                    totalMRR,
                    uncollectedMRR: uncollectedTotal,
                    activeCampaigns: camps.length,
                    newAudits7d: new7dRes.count || 0,
                });
            } catch (err) {
                console.error(err);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-[#050B1A]">
            <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
        </div>
    );

    if (isAdmin === false) return (
        <div className="min-h-screen flex items-center justify-center bg-[#050B1A] p-6">
            <div className="max-w-md w-full bg-slate-900 rounded-3xl p-12 text-center border border-white/10">
                <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-white mb-4">Access Denied</h1>
                <p className="text-slate-400 mb-8">This area is restricted to system administrators.</p>
                <button onClick={() => router.push('/dashboard')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500 transition-colors">Return to Dashboard</button>
            </div>
        </div>
    );

    const kpis = [
        {
            label: 'Uncollected MRR',
            value: fmtMoney(stats.uncollectedMRR),
            sub: `${uncollected.length} clients over contract`,
            icon: AlertTriangle,
            tint: 'rose',
            href: '/admin/ams',
        },
        {
            label: 'Active Campaigns',
            value: String(stats.activeCampaigns),
            sub: `${activeCampaigns.reduce((s, c) => s + c.stats_contacted, 0)} contacted`,
            icon: Megaphone,
            tint: 'blue',
            href: '/admin/outreach',
        },
        {
            label: 'New Audits · 7d',
            value: String(stats.newAudits7d),
            sub: `${stats.totalAudits} all-time`,
            icon: ClipboardList,
            tint: 'violet',
            href: '/admin/audits',
        },
        {
            label: 'Total Users',
            value: String(stats.totalProfiles),
            sub: `${fmtMoney(stats.totalMRR)} AMS MRR`,
            icon: Users,
            tint: 'emerald',
            href: '/admin/users',
        },
    ];

    const tintBg = (t: string) => ({
        rose: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
        blue: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
        violet: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
    }[t] || 'bg-white/5 text-white border-white/10');

    return (
        <div className="min-h-screen bg-[#050B1A] text-white">
            <div className="fixed top-0 right-0 h-[600px] w-[600px] rounded-full bg-blue-600/8 blur-[130px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[130px] pointer-events-none" />

            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Command Center
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white">Audcomp HQ</h1>
                        <p className="text-slate-500 text-sm mt-1">Revenue, outreach, and audit pipeline at a glance.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleResetMyAudit}
                            disabled={resetting}
                            title="Wipe your own audit and re-take the survey."
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-white/5 text-slate-400 hover:bg-amber-500/10 hover:text-amber-300 border border-white/10 hover:border-amber-500/30 disabled:opacity-50"
                        >
                            {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            {resetting ? 'Resetting…' : 'Reset My Audit'}
                        </button>
                    </div>
                </header>

                {/* KPI strip */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {kpis.map((k, i) => (
                        <motion.div
                            key={k.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link
                                href={k.href}
                                className="block bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 hover:border-white/15 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`h-10 w-10 rounded-xl border ${tintBg(k.tint)} flex items-center justify-center`}>
                                        <k.icon className="h-5 w-5" />
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
                                <p className="text-3xl font-black text-white tabular-nums leading-none mb-1">{k.value}</p>
                                <p className="text-xs text-slate-500 font-medium">{k.sub}</p>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* Two-column body */}
                <div className="grid grid-cols-12 gap-6 mb-6">
                    {/* Uncollected AMS Revenue */}
                    <div className="col-span-7 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-rose-400" />
                                <h2 className="font-bold text-white">Uncollected AMS Revenue</h2>
                                <span className="text-[10px] font-black bg-rose-500/10 text-rose-300 border border-rose-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    {fmtMoney(stats.uncollectedMRR)} / mo
                                </span>
                            </div>
                            <Link href="/admin/ams" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1">
                                View AMS <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>

                        {uncollected.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <p className="text-sm text-slate-500 font-medium">All synced clients are within contract. Nothing to collect.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {uncollected.map(c => (
                                    <div key={c.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-white/2 transition-colors">
                                        <div className="h-9 w-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                                            <Building2 className="h-4 w-4 text-rose-300" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white truncate">{c.company_name}</div>
                                            <div className="text-xs text-slate-500">
                                                {c.actual} actual · {c.contracted} contracted · <span className="text-rose-300 font-bold">+{c.delta} over</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-rose-300 tabular-nums">{fmtMoney(c.missingMRR)}/mo</div>
                                            <div className="text-[10px] text-slate-500 font-medium">@ {fmtMoney(c.pricePerUser)}/seat</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Outreach */}
                    <div className="col-span-5 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Megaphone className="h-5 w-5 text-blue-400" />
                                <h2 className="font-bold text-white">Active Campaigns</h2>
                            </div>
                            <Link href="/admin/outreach" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1">
                                Outreach <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>

                        {activeCampaigns.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <p className="text-sm text-slate-500 font-medium mb-4">No campaigns running right now.</p>
                                <Link href="/admin/outreach/campaigns/new" className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300">
                                    Launch a campaign <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {activeCampaigns.map(c => {
                                    const replyRate = c.stats_contacted > 0
                                        ? Math.round((c.stats_replied / c.stats_contacted) * 100)
                                        : 0;
                                    return (
                                        <Link
                                            key={c.id}
                                            href={`/admin/outreach/campaigns/${c.id}`}
                                            className="block px-6 py-3.5 hover:bg-white/2 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-white truncate">{c.name}</div>
                                                    <div className="text-[11px] text-slate-500 truncate">
                                                        {c.client_name || 'Audcomp'} · {fmtDate(c.updated_at)}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                                                    Active
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <Stat label="Researched" value={c.stats_researched} />
                                                <Stat label="Contacted" value={c.stats_contacted} />
                                                <Stat label="Replied" value={c.stats_replied} accent={replyRate >= 10 ? 'emerald' : undefined} />
                                                <Stat label="Booked" value={c.stats_booked} accent="violet" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent AI Audits */}
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="h-5 w-5 text-violet-400" />
                            <h2 className="font-bold text-white">New AI Audits</h2>
                            <span className="text-[10px] font-black bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                {stats.newAudits7d} this week
                            </span>
                        </div>
                        <Link href="/admin/audits" className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1">
                            All audits <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>

                    {recentAudits.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-sm text-slate-500 font-medium">No audits yet. Once users complete the survey they'll appear here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        {['User', 'Company', 'Score', 'Expert', 'Submitted'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentAudits.map(a => (
                                        <tr key={`${a.user_id}-${a.created_at}`} className="hover:bg-white/2 transition-colors">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-300 text-xs font-bold shrink-0">
                                                        {(a.full_name || a.email || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-bold text-white truncate">{a.full_name || 'No name'}</div>
                                                        <div className="text-xs text-slate-500 truncate">{a.email || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-sm text-slate-400">{a.organization || '—'}</td>
                                            <td className="px-6 py-3.5">
                                                {a.overall_score != null ? (
                                                    <span className={`text-sm font-black tabular-nums ${
                                                        a.overall_score >= 65 ? 'text-emerald-300'
                                                            : a.overall_score >= 40 ? 'text-amber-300'
                                                            : 'text-rose-300'
                                                    }`}>{a.overall_score}%</span>
                                                ) : <span className="text-slate-600">—</span>}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                {a.expert_name
                                                    ? <span className="text-sm font-bold text-slate-300">{a.expert_name}</span>
                                                    : <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Unassigned</span>}
                                            </td>
                                            <td className="px-6 py-3.5 text-xs text-slate-500 font-medium tabular-nums">
                                                {new Date(a.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'violet' }) {
    const tint = accent === 'emerald' ? 'text-emerald-300'
        : accent === 'violet' ? 'text-violet-300'
        : 'text-white';
    return (
        <div className="bg-black/20 rounded-lg py-2">
            <div className={`text-base font-black tabular-nums ${tint}`}>{value}</div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
        </div>
    );
}
