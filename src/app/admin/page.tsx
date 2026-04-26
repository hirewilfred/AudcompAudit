'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import {
    Users, ArrowRight, TrendingUp, Eye, Plus, Loader2, CheckCircle2,
    ShieldAlert, LogOut, Bot, Zap, Play, Pause, Activity, Sparkles,
    ClipboardList, UserCircle, LayoutDashboard, RefreshCw, ChevronRight,
    DollarSign, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { DEMO_AGENTS } from '@/lib/demoData';

const AGENT_COLORS = ['blue', 'violet', 'rose', 'emerald', 'amber', 'pink', 'cyan', 'indigo', 'teal', 'orange'];

const statusStyle = (s: string) =>
    s === 'running' ? 'bg-emerald-500 animate-pulse' : s === 'queued' ? 'bg-amber-400' : 'bg-slate-500';

const agentBorder = (c: string) => ({
    blue: 'border-blue-500/20', violet: 'border-violet-500/20',
    rose: 'border-rose-500/20', emerald: 'border-emerald-500/20',
    amber: 'border-amber-500/20', pink: 'border-pink-500/20',
    cyan: 'border-cyan-500/20', indigo: 'border-indigo-500/20',
    teal: 'border-teal-500/20', orange: 'border-orange-500/20',
}[c] || 'border-white/5');

// ── Quick-nav items ───────────────────────────────────────────────────────────
const QUICK_NAV = [
    { label: 'Command Center', icon: LayoutDashboard, href: '/admin', color: 'text-blue-400' },
    { label: 'Audit Results', icon: ClipboardList, href: '/admin/audits', color: 'text-violet-400' },
    { label: 'Managed Experts', icon: UserCircle, href: '/admin/experts', color: 'text-emerald-400' },
    { label: 'Users', icon: Users, href: '/admin/users', color: 'text-amber-400' },
    { label: 'CRM', icon: Briefcase, href: '/admin/crm', color: 'text-pink-400' },
];

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [stats, setStats] = useState({ totalExperts: 0, totalProfiles: 0, totalAudits: 0 });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [demoMode, setDemoMode] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    useEffect(() => {
        async function checkAdmin() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) { router.push('/auth'); return; }

                const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
                const profile = data as { is_admin: boolean } | null;

                if (!profile?.is_admin) { setIsAdmin(false); return; }
                setIsAdmin(true);

                const [expertsRes, profilesRes, scoresRes, profilesListRes, expertsListRes, scoresListRes] = await Promise.all([
                    supabase.from('experts').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('*', { count: 'exact', head: true }),
                    supabase.from('audit_scores').select('*', { count: 'exact', head: true }),
                    supabase.from('profiles').select('id, full_name, email, organization, has_completed_audit, assigned_expert_id, updated_at').order('updated_at', { ascending: false }).limit(50),
                    supabase.from('experts').select('id, full_name, photo_url, email'),
                    supabase.from('audit_scores').select('user_id, created_at, overall_score'),
                ]);

                setStats({ totalExperts: expertsRes.count || 0, totalProfiles: profilesRes.count || 0, totalAudits: scoresRes.count || 0 });

                if (profilesListRes.data) {
                    const allExperts = expertsListRes.data || [];
                    const allScores = scoresListRes.data || [];
                    const merged = profilesListRes.data.map((p: any) => {
                        const expert = allExperts.find((e: any) => e.id === p.assigned_expert_id);
                        const userScores = allScores.filter((s: any) => s.user_id === p.id).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                        return { ...p, experts: expert ? [expert] : [], audit_scores: userScores.length > 0 ? [userScores[0]] : [] };
                    });
                    setRecentUsers(merged);
                }
            } catch (err) {
                console.error(err);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        }
        checkAdmin();
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

    const runningAgents = DEMO_AGENTS.filter(a => a.status === 'running').length;

    return (
        <div className="min-h-screen bg-[#050B1A] text-white">
            {/* Ambient glow */}
            <div className="fixed top-0 right-0 h-[600px] w-[600px] rounded-full bg-blue-600/8 blur-[130px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-violet-600/5 blur-[130px] pointer-events-none" />

            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                {/* ── Header ── */}
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            {demoMode ? 'Demo Mode Active' : 'System Active'}
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-white">AI Command Center</h1>
                        <p className="text-slate-500 text-sm mt-1">Audcomp Admin Portal — Real-time AI oversight</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.open('/demo', '_blank', 'width=1400,height=900')}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all bg-white/5 text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 hover:border-rose-500/30"
                        >
                            <Play className="h-4 w-4" />
                            Florist Live Demo
                        </button>
                        <button onClick={() => router.push('/admin/experts/new')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-blue-600/20">
                            <Plus className="h-4 w-4" /> Add Expert
                        </button>
                    </div>
                </header>

                {/* ── Quick Nav Bar ── */}
                <div className="flex items-center gap-2 mb-8 p-1.5 bg-white/3 rounded-2xl border border-white/5 w-fit">
                    {QUICK_NAV.map(item => (
                        <Link key={item.href} href={item.href} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-white/8 transition-all">
                            <item.icon className={`h-4 w-4 ${item.color}`} />
                            {item.label}
                        </Link>
                    ))}
                </div>

                {/* ── Stats ── */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Active Agents', value: demoMode ? runningAgents : 0, icon: Bot, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                        { label: 'Managed Experts', value: stats.totalExperts, icon: UserCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Total Users', value: stats.totalProfiles, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                        { label: 'Audits Completed', value: stats.totalAudits, icon: ClipboardList, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    ].map((stat, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5 flex items-center gap-4">
                            <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-3xl font-black text-white tabular-nums">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-12 gap-6">

                    {/* AI Agents Panel */}
                    <div className="col-span-7 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Bot className="h-5 w-5 text-blue-400" />
                                <h2 className="font-bold text-white">AI Agents</h2>
                                {demoMode && <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">{runningAgents} Running</span>}
                            </div>
                            {!demoMode && <span className="text-xs text-slate-500 font-bold">Click "Florist Live Demo" to see agents live</span>}
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {DEMO_AGENTS.map((agent, i) => {
                                const color = AGENT_COLORS[i % AGENT_COLORS.length];
                                return (
                                    <div key={agent.name} className={`rounded-xl border p-4 ${demoMode ? agentBorder(color) : 'border-white/5'} bg-white/2 transition-all`}>
                                        <div className="flex items-start gap-3 mb-2">
                                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${demoMode ? statusStyle(agent.status) : 'bg-slate-700'}`} />
                                            <div>
                                                <div className="text-sm font-bold text-white">{agent.label}</div>
                                                <div className="text-[10px] text-slate-500">{agent.description.split('.')[0]}</div>
                                            </div>
                                            <span className={`ml-auto text-[10px] font-black px-2 py-0.5 rounded-full capitalize ${
                                                demoMode
                                                    ? agent.status === 'running' ? 'bg-emerald-500/10 text-emerald-400' : agent.status === 'queued' ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-slate-500'
                                                    : 'bg-white/5 text-slate-600'
                                            }`}>{demoMode ? agent.status : 'idle'}</span>
                                        </div>
                                        {demoMode && agent.currentTask && <div className="text-[11px] text-slate-400 bg-black/20 rounded-lg px-3 py-2 leading-relaxed">{agent.currentTask}</div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* AI Audits Summary */}
                    <div className="col-span-5 flex flex-col gap-4">
                        {/* Audit quick-links */}
                        <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-5">
                            <h2 className="font-bold text-white mb-4 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-violet-400" /> AI Audits</h2>
                            <div className="space-y-2">
                                <Link href="/admin/audits" className="flex items-center justify-between p-3 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-violet-500/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <ClipboardList className="h-4 w-4 text-violet-400" />
                                        <span className="text-sm font-bold text-white">Audit Results</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-violet-400">{stats.totalAudits} total</span>
                                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                                    </div>
                                </Link>
                                <Link href="/admin/experts" className="flex items-center justify-between p-3 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-emerald-500/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <UserCircle className="h-4 w-4 text-emerald-400" />
                                        <span className="text-sm font-bold text-white">Managed Experts</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-emerald-400">{stats.totalExperts} active</span>
                                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                                    </div>
                                </Link>
                                <Link href="/admin/users" className="flex items-center justify-between p-3 rounded-xl bg-white/3 hover:bg-white/6 border border-white/5 hover:border-blue-500/30 transition-all group">
                                    <div className="flex items-center gap-3">
                                        <Users className="h-4 w-4 text-blue-400" />
                                        <span className="text-sm font-bold text-white">Users</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black text-blue-400">{stats.totalProfiles} registered</span>
                                        <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                                    </div>
                                </Link>
                            </div>
                        </div>

                        {/* Completion rate card */}
                        <div className="bg-gradient-to-br from-blue-600/20 to-violet-600/20 rounded-2xl border border-blue-500/20 p-5 flex-1">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Audit Completion Rate</div>
                            <div className="text-5xl font-black text-white mb-2">
                                {stats.totalProfiles > 0 ? Math.round((stats.totalAudits / stats.totalProfiles) * 100) : 0}%
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden mb-4">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.totalProfiles > 0 ? Math.min(100, Math.round((stats.totalAudits / stats.totalProfiles) * 100)) : 0}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
                                />
                            </div>
                            <p className="text-xs text-slate-400">{stats.totalAudits} of {stats.totalProfiles} users have completed the AI audit</p>
                        </div>
                    </div>

                    {/* Recent Users / Audit History */}
                    <div className="col-span-12 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <h2 className="font-bold text-white flex items-center gap-2"><Activity className="h-5 w-5 text-amber-400" /> Recent Users & Audit History</h2>
                            <Link href="/admin/users" className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1">View All <ArrowRight className="h-3 w-3" /></Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        {['User', 'Company', 'Audit Status', 'Score', 'Assigned Expert', 'Date'].map(h => (
                                            <th key={h} className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recentUsers.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-bold">No users found.</td></tr>
                                    ) : recentUsers.slice(0, 15).map((u, i) => {
                                        const score = Array.isArray(u.audit_scores) ? u.audit_scores[0] : null;
                                        const expert = Array.isArray(u.experts) ? u.experts[0] : null;
                                        const date = score?.created_at || u.updated_at;
                                        return (
                                            <tr key={u.id || i} className="hover:bg-white/2 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                                                            {(u.full_name || 'U').charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-bold text-white">{u.full_name || 'No name'}</div>
                                                            <div className="text-xs text-slate-500">{u.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-400">{u.organization || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${u.has_completed_audit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-white/5 text-slate-500 border border-white/5'}`}>
                                                        {u.has_completed_audit ? 'Complete' : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold">
                                                    {score?.overall_score != null ? (
                                                        <span className={score.overall_score >= 65 ? 'text-emerald-400' : score.overall_score >= 40 ? 'text-amber-400' : 'text-red-400'}>
                                                            {score.overall_score}%
                                                        </span>
                                                    ) : <span className="text-slate-600">—</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {expert ? (
                                                        <div className="flex items-center gap-2">
                                                            {expert.photo_url && <img src={expert.photo_url} className="w-6 h-6 rounded-full object-cover" />}
                                                            <span className="text-sm font-bold text-slate-300">{expert.full_name}</span>
                                                        </div>
                                                    ) : <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">Unassigned</span>}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-500">
                                                    {date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
