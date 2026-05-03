'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import {
    Users, ArrowRight, Loader2, ShieldAlert, Activity,
    ClipboardList, RotateCcw, DollarSign, Megaphone,
    Building2, ChevronRight, AlertTriangle, TrendingUp, AlertCircle, Bell, Info, Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const fmtMoney = (n: number) =>
    n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
const fmtDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

type Anomaly = {
    id: string;
    severity: 'critical' | 'warning' | 'info';
    category: 'sla' | 'tech_kpi' | 'stalled' | 'ams' | 'outreach';
    title: string;
    detail: string;
    metric?: string;
    href?: string;
};

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
    const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
    const [anomaliesLoading, setAnomaliesLoading] = useState(true);

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

    // Anomalies — separate effect, runs after admin gate, refreshes every 60s
    useEffect(() => {
        if (isAdmin !== true) return;
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetch('/api/admin/anomalies');
                if (!res.ok) return;
                const j = await res.json();
                if (!cancelled) setAnomalies(j.anomalies ?? []);
            } catch {
                // silent
            } finally {
                if (!cancelled) setAnomaliesLoading(false);
            }
        };
        load();
        const interval = setInterval(load, 60_000);
        return () => { cancelled = true; clearInterval(interval); };
    }, [isAdmin]);

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE]">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
    );

    if (isAdmin === false) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-slate-900 mb-4">Access Denied</h1>
                <p className="text-slate-500 mb-8">This area is restricted to system administrators.</p>
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
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        violet: 'bg-violet-50 text-violet-600 border-violet-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    }[t] || 'bg-slate-50 text-slate-600 border-slate-100');

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            <div className="fixed top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
            <div className="fixed bottom-[-10%] left-[-5%] h-[400px] w-[400px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />

            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                {/* Hero header — dark navy gradient with dotted texture */}
                <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-8 md:p-10 shadow-xl shadow-blue-900/20">
                    <div
                        className="absolute inset-0 opacity-30 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.35) 1px, transparent 0)',
                            backgroundSize: '24px 24px',
                        }}
                    />
                    <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/30 blur-[120px] pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />

                    <header className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                Command Center
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.05]">Audcomp <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">HQ</span></h1>
                            <p className="text-blue-100/80 text-sm mt-2 max-w-2xl leading-relaxed">Revenue, outreach, and audit pipeline at a glance.</p>
                        </div>
                        <button
                            onClick={handleResetMyAudit}
                            disabled={resetting}
                            title="Wipe your own audit and re-take the survey."
                            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all bg-white/10 backdrop-blur text-blue-100 hover:bg-amber-500/20 hover:text-amber-200 border border-white/15 hover:border-amber-400/40 disabled:opacity-50"
                        >
                            {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                            {resetting ? 'Resetting…' : 'Reset My Audit'}
                        </button>
                    </header>
                </div>

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
                                className="block bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className={`h-10 w-10 rounded-xl border ${tintBg(k.tint)} flex items-center justify-center`}>
                                        <k.icon className="h-5 w-5" />
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                                </div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{k.label}</p>
                                <p className="text-3xl font-black text-slate-900 tabular-nums leading-none mb-1">{k.value}</p>
                                <p className="text-xs text-slate-500 font-medium">{k.sub}</p>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* ── Things you should know — anomalies feed ── */}
                <AnomaliesPanel anomalies={anomalies} loading={anomaliesLoading} />

                {/* Two-column body */}
                <div className="grid grid-cols-12 gap-6 mb-6">
                    {/* Uncollected AMS Revenue */}
                    <div className="col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <DollarSign className="h-5 w-5 text-rose-500" />
                                <h2 className="font-bold text-slate-900">Uncollected AMS Revenue</h2>
                                <span className="text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                    {fmtMoney(stats.uncollectedMRR)} / mo
                                </span>
                            </div>
                            <Link href="/admin/ams" className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
                                View AMS <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>

                        {uncollected.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <p className="text-sm text-slate-500 font-medium">All synced clients are within contract. Nothing to collect.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {uncollected.map(c => (
                                    <div key={c.id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                                        <div className="h-9 w-9 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                                            <Building2 className="h-4 w-4 text-rose-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-900 truncate">{c.company_name}</div>
                                            <div className="text-xs text-slate-500">
                                                {c.actual} actual · {c.contracted} contracted · <span className="text-rose-600 font-bold">+{c.delta} over</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-rose-600 tabular-nums">{fmtMoney(c.missingMRR)}/mo</div>
                                            <div className="text-[10px] text-slate-500 font-medium">@ {fmtMoney(c.pricePerUser)}/seat</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Active Outreach */}
                    <div className="col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Megaphone className="h-5 w-5 text-blue-600" />
                                <h2 className="font-bold text-slate-900">Active Campaigns</h2>
                            </div>
                            <Link href="/admin/outreach" className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
                                Outreach <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>

                        {activeCampaigns.length === 0 ? (
                            <div className="px-6 py-12 text-center">
                                <p className="text-sm text-slate-500 font-medium mb-4">No campaigns running right now.</p>
                                <Link href="/admin/outreach/campaigns/new" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700">
                                    Launch a campaign <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {activeCampaigns.map(c => {
                                    const replyRate = c.stats_contacted > 0
                                        ? Math.round((c.stats_replied / c.stats_contacted) * 100)
                                        : 0;
                                    return (
                                        <Link
                                            key={c.id}
                                            href={`/admin/outreach/campaigns/${c.id}`}
                                            className="block px-6 py-3.5 hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold text-slate-900 truncate">{c.name}</div>
                                                    <div className="text-[11px] text-slate-500 truncate">
                                                        {c.client_name || 'Audcomp'} · {fmtDate(c.updated_at)}
                                                    </div>
                                                </div>
                                                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full uppercase tracking-widest shrink-0">
                                                    Active
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <Stat label="Researched" value={c.stats_researched} />
                                                <Stat label="Contacted" value={c.stats_contacted} />
                                                <Stat label="Replied" value={c.stats_replied} accent={replyRate >= 10 ? 'emerald' : undefined} />
                                                <Stat label="Booked" value={c.stats_booked} accent="blue" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent AI Audits */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Activity className="h-5 w-5 text-blue-600" />
                            <h2 className="font-bold text-slate-900">New AI Audits</h2>
                            <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-widest">
                                {stats.newAudits7d} this week
                            </span>
                        </div>
                        <Link href="/admin/audits" className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1">
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
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        {['User', 'Company', 'Score', 'Expert', 'Submitted'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentAudits.map(a => (
                                        <tr
                                            key={`${a.user_id}-${a.created_at}`}
                                            onClick={() => router.push(`/admin/audits/${a.user_id}`)}
                                            className="hover:bg-slate-50 transition-colors cursor-pointer">
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                                                        {(a.full_name || a.email || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-bold text-slate-900 truncate">{a.full_name || 'No name'}</div>
                                                        <div className="text-xs text-slate-500 truncate">{a.email || '—'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 text-sm text-slate-600">{a.organization || '—'}</td>
                                            <td className="px-6 py-3.5">
                                                {a.overall_score != null ? (
                                                    <span className={`text-sm font-black tabular-nums ${
                                                        a.overall_score >= 65 ? 'text-emerald-600'
                                                            : a.overall_score >= 40 ? 'text-amber-600'
                                                            : 'text-rose-600'
                                                    }`}>{a.overall_score}%</span>
                                                ) : <span className="text-slate-400">—</span>}
                                            </td>
                                            <td className="px-6 py-3.5">
                                                {a.expert_name
                                                    ? <span className="text-sm font-bold text-slate-700">{a.expert_name}</span>
                                                    : <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Unassigned</span>}
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

function AnomaliesPanel({ anomalies, loading }: { anomalies: Anomaly[]; loading: boolean }) {
    const critical = anomalies.filter(a => a.severity === 'critical').length;
    const warning = anomalies.filter(a => a.severity === 'warning').length;
    const info = anomalies.filter(a => a.severity === 'info').length;
    const allClear = !loading && anomalies.length === 0;

    const tone = (s: Anomaly['severity']) => s === 'critical'
        ? { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', dot: 'bg-rose-500', icon: AlertCircle }
        : s === 'warning'
        ? { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500', icon: AlertTriangle }
        : { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500', icon: Info };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
                        critical > 0 ? 'bg-rose-50 border-rose-200 text-rose-600'
                            : warning > 0 ? 'bg-amber-50 border-amber-200 text-amber-600'
                            : allClear ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                            : 'bg-blue-50 border-blue-200 text-blue-600'
                    }`}>
                        <Bell className={`h-4 w-4 ${critical > 0 ? 'animate-pulse' : ''}`} />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-900">Things you should know</h2>
                        <p className="text-[11px] text-slate-500 font-medium">SLA breaches, KPI misses, stalled tickets, and money on the table.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {critical > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" /> {critical} critical
                        </span>
                    )}
                    {warning > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> {warning} warning
                        </span>
                    )}
                    {info > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-500" /> {info} info
                        </span>
                    )}
                    {allClear && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All clear
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="px-6 py-8 flex items-center justify-center">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                </div>
            ) : allClear ? (
                <div className="px-6 py-10 text-center">
                    <div className="h-10 w-10 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-3">
                        <Zap className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">No anomalies right now.</p>
                    <p className="text-xs text-slate-500 mt-1">SLAs are met, KPIs are on track, AMS clients are within contract.</p>
                </div>
            ) : (
                <div className="divide-y divide-slate-100">
                    {anomalies.map(a => {
                        const t = tone(a.severity);
                        const Icon = t.icon;
                        const Wrapper: any = a.href ? Link : 'div';
                        const wrapperProps = a.href ? { href: a.href } : {};
                        return (
                            <Wrapper
                                key={a.id}
                                {...wrapperProps}
                                className={`block px-6 py-3.5 hover:bg-slate-50 transition-colors flex items-center gap-4 ${a.href ? 'cursor-pointer' : ''}`}
                            >
                                <div className={`h-9 w-9 rounded-lg ${t.bg} ${t.border} border ${t.text} flex items-center justify-center shrink-0`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${t.bg} ${t.border} ${t.text}`}>
                                            {a.severity}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{a.category.replace('_', ' ')}</span>
                                        <span className="text-sm font-black text-slate-900">{a.title}</span>
                                    </div>
                                    <div className="text-xs text-slate-600 mt-1 line-clamp-1">{a.detail}</div>
                                </div>
                                {a.metric && (
                                    <div className={`text-sm font-black tabular-nums ${t.text} shrink-0`}>{a.metric}</div>
                                )}
                                {a.href && <ChevronRight className="h-4 w-4 text-slate-300 shrink-0" />}
                            </Wrapper>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'blue' }) {
    const tint = accent === 'emerald' ? 'text-emerald-600'
        : accent === 'blue' ? 'text-blue-600'
        : 'text-slate-900';
    return (
        <div className="bg-slate-50 rounded-lg py-2 border border-slate-100">
            <div className={`text-base font-black tabular-nums ${tint}`}>{value}</div>
            <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</div>
        </div>
    );
}
