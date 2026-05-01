'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ClipboardList, Search, Loader2, ShieldAlert, ArrowRight, ArrowLeft,
    Filter, TrendingUp, Users, CheckCircle2, ExternalLink, FileText, Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AdminNavbar from '@/components/AdminNavbar';
import { createClient } from '@/lib/supabase/client';

type AuditRow = {
    user_id: string;
    full_name: string | null;
    email: string | null;
    organization: string | null;
    has_completed_audit: boolean;
    assigned_expert_id: string | null;
    expert_name?: string | null;
    expert_photo?: string | null;
    overall_score: number | null;
    category_scores: Record<string, number> | null;
    has_advisor_report: boolean;
    score_created_at: string | null;
    report_updated_at: string | null;
};

type Sort = 'recent' | 'score_high' | 'score_low' | 'name';
type Filt = 'all' | 'complete' | 'pending' | 'unassigned';

const scoreColor = (s: number | null) =>
    s == null ? 'text-slate-600' :
    s >= 75 ? 'text-emerald-400' :
    s >= 50 ? 'text-amber-400' :
    'text-red-400';

const scoreBg = (s: number | null) =>
    s == null ? 'bg-white/5 border-white/5' :
    s >= 75 ? 'bg-emerald-500/10 border-emerald-500/20' :
    s >= 50 ? 'bg-amber-500/10 border-amber-500/20' :
    'bg-red-500/10 border-red-500/20';

export default function AdminAuditsPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [rows, setRows] = useState<AuditRow[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<Filt>('all');
    const [sort, setSort] = useState<Sort>('recent');

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { router.push('/auth'); return; }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                if (!(profile as any)?.is_admin) { setIsAdmin(false); return; }
                setIsAdmin(true);

                const [profilesRes, scoresRes, expertsRes, reportsRes] = await Promise.all([
                    supabase.from('profiles').select('id, full_name, email, organization, has_completed_audit, assigned_expert_id'),
                    supabase.from('audit_scores').select('user_id, overall_score, category_scores, created_at').order('created_at', { ascending: false }),
                    supabase.from('experts').select('id, full_name, photo_url'),
                    supabase.from('ai_advisor_reports').select('user_id, updated_at').order('updated_at', { ascending: false }),
                ]);

                const profiles = (profilesRes.data ?? []) as any[];
                const scores = (scoresRes.data ?? []) as any[];
                const experts = (expertsRes.data ?? []) as any[];
                const reports = (reportsRes.data ?? []) as any[];

                const expertMap = new Map(experts.map(e => [e.id, e]));
                const latestScore = new Map<string, any>();
                scores.forEach(s => { if (!latestScore.has(s.user_id)) latestScore.set(s.user_id, s); });
                const latestReport = new Map<string, any>();
                reports.forEach(r => { if (!latestReport.has(r.user_id)) latestReport.set(r.user_id, r); });

                const merged: AuditRow[] = profiles.map(p => {
                    const score = latestScore.get(p.id);
                    const report = latestReport.get(p.id);
                    const expert = p.assigned_expert_id ? expertMap.get(p.assigned_expert_id) : null;
                    return {
                        user_id: p.id,
                        full_name: p.full_name,
                        email: p.email,
                        organization: p.organization,
                        has_completed_audit: !!p.has_completed_audit,
                        assigned_expert_id: p.assigned_expert_id,
                        expert_name: expert?.full_name ?? null,
                        expert_photo: expert?.photo_url ?? null,
                        overall_score: score?.overall_score ?? null,
                        category_scores: score?.category_scores ?? null,
                        has_advisor_report: !!report,
                        score_created_at: score?.created_at ?? null,
                        report_updated_at: report?.updated_at ?? null,
                    };
                });

                setRows(merged);
            } catch (err) {
                console.error('audit list load failed', err);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const filtered = useMemo(() => {
        let out = [...rows];

        if (filter === 'complete') out = out.filter(r => r.has_completed_audit);
        else if (filter === 'pending') out = out.filter(r => !r.has_completed_audit);
        else if (filter === 'unassigned') out = out.filter(r => !r.assigned_expert_id);

        if (search.trim()) {
            const q = search.toLowerCase();
            out = out.filter(r =>
                (r.full_name ?? '').toLowerCase().includes(q) ||
                (r.email ?? '').toLowerCase().includes(q) ||
                (r.organization ?? '').toLowerCase().includes(q)
            );
        }

        if (sort === 'recent') {
            out.sort((a, b) => {
                const ad = new Date(a.score_created_at ?? a.report_updated_at ?? 0).getTime();
                const bd = new Date(b.score_created_at ?? b.report_updated_at ?? 0).getTime();
                return bd - ad;
            });
        } else if (sort === 'score_high') {
            out.sort((a, b) => (b.overall_score ?? -1) - (a.overall_score ?? -1));
        } else if (sort === 'score_low') {
            out.sort((a, b) => (a.overall_score ?? 999) - (b.overall_score ?? 999));
        } else if (sort === 'name') {
            out.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? ''));
        }
        return out;
    }, [rows, search, filter, sort]);

    const stats = useMemo(() => {
        const completed = rows.filter(r => r.has_completed_audit).length;
        const withScore = rows.filter(r => r.overall_score != null);
        const avg = withScore.length > 0
            ? Math.round(withScore.reduce((s, r) => s + (r.overall_score ?? 0), 0) / withScore.length)
            : 0;
        const unassigned = rows.filter(r => r.has_completed_audit && !r.assigned_expert_id).length;
        return { total: rows.length, completed, avg, unassigned };
    }, [rows]);

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-[#050B1A]">
            <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
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

    return (
        <div className="min-h-screen bg-[#050B1A] text-white">
            <div className="fixed top-0 right-0 h-[600px] w-[600px] rounded-full bg-violet-600/8 blur-[130px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none" />

            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/admin" className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white mb-3 transition-colors">
                            <ArrowLeft className="h-3 w-3" /> Back to Command Center
                        </Link>
                        <div className="flex items-center gap-2 text-violet-400 font-bold text-xs uppercase tracking-widest mb-2">
                            <ClipboardList className="h-3 w-3" /> Audit Results
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white">AI Audit Results</h1>
                        <p className="text-slate-500 text-sm mt-1">Every customer audit · scores, answers, and the AI roadmap your reps need.</p>
                    </div>
                </header>

                {/* Stats row */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Customers', value: stats.total, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Audits Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Average Score', value: `${stats.avg}%`, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                        { label: 'Unassigned to Expert', value: stats.unassigned, icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    ].map((s, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl ${s.bg} flex items-center justify-center`}>
                                <s.icon className={`h-6 w-6 ${s.color}`} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</p>
                                <p className="text-3xl font-black text-white tabular-nums">{s.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search by name, email, or organization…"
                            className="w-full bg-slate-900/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-violet-500/50 focus:outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-1 bg-slate-900/40 border border-white/5 rounded-xl p-1">
                        {(['all', 'complete', 'pending', 'unassigned'] as Filt[]).map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${filter === f ? 'bg-violet-600 text-white' : 'text-slate-500 hover:text-white'}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 bg-slate-900/40 border border-white/5 rounded-xl px-3 py-2">
                        <Filter className="h-3.5 w-3.5 text-slate-500" />
                        <select value={sort} onChange={e => setSort(e.target.value as Sort)}
                            className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer">
                            <option value="recent" className="bg-slate-900">Most Recent</option>
                            <option value="score_high" className="bg-slate-900">Score (High → Low)</option>
                            <option value="score_low" className="bg-slate-900">Score (Low → High)</option>
                            <option value="name" className="bg-slate-900">Name (A → Z)</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/2">
                                    {['Customer', 'Organization', 'Status', 'Score', 'Top Categories', 'Assigned Expert', 'Date', ''].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={8} className="px-6 py-16 text-center text-slate-500 font-bold">
                                        {rows.length === 0 ? 'No audit data yet.' : 'No customers match your filters.'}
                                    </td></tr>
                                ) : filtered.map(r => {
                                    const date = r.score_created_at || r.report_updated_at;
                                    const cats = r.category_scores
                                        ? Object.entries(r.category_scores).sort((a, b) => (Number(b[1]) - Number(a[1]))).slice(0, 2)
                                        : [];
                                    // Always link — the detail page renders an empty state when the
                                    // user hasn't filled out either questionnaire yet.
                                    const linkable = true;
                                    return (
                                        <tr key={r.user_id} className="hover:bg-white/3 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-300 text-sm font-black shrink-0">
                                                        {(r.full_name ?? r.email ?? 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{r.full_name || 'No name'}</div>
                                                        <div className="text-xs text-slate-500">{r.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-sm text-slate-300">{r.organization || '—'}</td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                                    r.has_completed_audit
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : 'bg-white/5 text-slate-500 border-white/10'
                                                }`}>
                                                    {r.has_completed_audit ? 'Complete' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                {r.overall_score != null ? (
                                                    <div className={`inline-flex items-center justify-center min-w-[58px] px-2.5 py-1 rounded-lg border font-black text-sm tabular-nums ${scoreBg(r.overall_score)} ${scoreColor(r.overall_score)}`}>
                                                        {r.overall_score}%
                                                    </div>
                                                ) : <span className="text-slate-600 text-sm">—</span>}
                                            </td>
                                            <td className="px-5 py-4">
                                                {cats.length === 0 ? (
                                                    <span className="text-xs text-slate-600">—</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {cats.map(([k, v]) => (
                                                            <span key={k} className="text-[10px] font-bold bg-white/5 text-slate-300 border border-white/5 px-2 py-0.5 rounded-full">
                                                                {k} <span className="text-violet-400">{Number(v)}%</span>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {r.expert_name ? (
                                                    <div className="flex items-center gap-2">
                                                        {r.expert_photo && <img src={r.expert_photo} className="w-6 h-6 rounded-full object-cover" alt="" />}
                                                        <span className="text-sm font-bold text-slate-300">{r.expert_name}</span>
                                                    </div>
                                                ) : <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">Unassigned</span>}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                                                {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                {linkable ? (
                                                    <Link
                                                        href={`/admin/audits/${r.user_id}`}
                                                        className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg transition-colors"
                                                    >
                                                        <FileText className="h-3 w-3" />
                                                        View Roadmap
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-600">No data</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-4 text-xs text-slate-600 text-center">
                    Click <span className="font-black text-violet-400">View Roadmap</span> on any row to see that customer's full audit answers, category breakdown, recommendations, and AI roadmap — exactly what your sales reps need before a call.
                </div>
            </main>
        </div>
    );
}
