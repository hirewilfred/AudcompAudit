'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import {
    Users,
    ArrowRight,
    TrendingUp,
    Eye,
    Plus,
    Loader2,
    CheckCircle2,
    ShieldAlert,
    ShieldOff,
    LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [stats, setStats] = useState({
        totalExperts: 0,
        totalProfiles: 0,
        totalAudits: 0
    });
    const [recentCompletions, setRecentCompletions] = useState<any[]>([]);

    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        router.push('/auth');
    };

    useEffect(() => {
        async function checkAdmin() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/auth');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                const profile = data as { is_admin: boolean } | null;

                if (error || !profile?.is_admin) {
                    setIsAdmin(false);
                } else {
                    setIsAdmin(true);
                    // Fetch stats if admin
                    const [expertsRes, profilesRes, scoresRes, completionsRes] = await Promise.all([
                        supabase.from('experts').select('*', { count: 'exact', head: true }),
                        supabase.from('profiles').select('*', { count: 'exact', head: true }),
                        supabase.from('audit_scores').select('*', { count: 'exact', head: true }),
                        supabase.from('profiles')
                            .select(`
                                id,
                                full_name,
                                organization,
                                has_completed_audit,
                                assigned_expert_id,
                                experts ( id, full_name, photo_url ),
                                audit_scores ( created_at, overall_score )
                            `)
                            .eq('has_completed_audit', true)
                            .order('updated_at', { ascending: false })
                            .limit(10)
                    ]);

                    setStats({
                        totalExperts: expertsRes.count || 0,
                        totalProfiles: profilesRes.count || 0,
                        totalAudits: scoresRes.count || 0
                    });

                    if (completionsRes.data) {
                        setRecentCompletions(completionsRes.data);
                    }

                }
            } catch (err) {
                console.error("Auth check failed:", err);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        }
        checkAdmin();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white rounded-[48px] p-12 text-center shadow-xl border border-slate-100">
                    <div className="h-20 w-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner">
                        <ShieldAlert className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Access Denied</h1>
                    <p className="text-slate-500 font-bold leading-relaxed mb-10">
                        This area is restricted to system administrators. Please contact your coordinator if you believe this is an error.
                    </p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] hover:bg-black transition-all flex items-center justify-center gap-2 group"
                        >
                            Return to Dashboard
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full bg-white text-red-600 border border-red-100 font-black py-5 rounded-[24px] hover:bg-red-50 transition-all flex items-center justify-center gap-2 group"
                        >
                            <LogOut className="h-5 w-5" />
                            Sign Out & Switch Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />

            <main className="pl-64 pr-10 pt-10 pb-20">
                {/* Header */}
                <header className="flex items-end justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                            <CheckCircle2 className="h-3 w-3" />
                            System Active
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Admin Control Center</h1>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
                        <button
                            onClick={() => router.push('/admin/experts/new')}
                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all flex items-center gap-3"
                        >
                            <Plus className="h-5 w-5" />
                            Add New Expert
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { label: 'Active Experts', value: stats.totalExperts, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Total Users', value: stats.totalProfiles, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Audits Completed', value: stats.totalAudits, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                        >
                            <div className={`h-16 w-16 rounded-[24px] ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                                <stat.icon className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                <p className="text-4xl font-black text-slate-900 tabular-nums">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-12 gap-8">
                    <section className="col-span-12 lg:col-span-8 bg-white rounded-[48px] p-10 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                Recent Completions
                            </h2>
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="text-slate-400 font-bold hover:text-blue-600 transition-colors uppercase tracking-widest text-xs flex items-center gap-2"
                            >
                                View All Users <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-4 pt-2 text-xs font-black uppercase tracking-widest text-slate-400">User</th>
                                        <th className="pb-4 pt-2 text-xs font-black uppercase tracking-widest text-slate-400">Score</th>
                                        <th className="pb-4 pt-2 text-xs font-black uppercase tracking-widest text-slate-400">Assigned Expert</th>
                                        <th className="pb-4 pt-2 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Completion Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentCompletions.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">
                                                No completed audits yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentCompletions.map((completion, idx) => {
                                            const scoreObj = Array.isArray(completion.audit_scores) ? completion.audit_scores[0] : completion.audit_scores;
                                            const expertObj = Array.isArray(completion.experts) ? completion.experts[0] : completion.experts;

                                            // Handle case where scoreObj might be undefined if no scores exist
                                            const completionDate = scoreObj?.created_at
                                                ? new Date(scoreObj.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : 'Unknown';

                                            return (
                                                <tr key={completion.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                    <td className="py-4 font-black flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                            {completion.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span>{completion.full_name || 'Unknown User'}</span>
                                                            <span className="text-xs font-bold text-slate-400">{completion.organization || 'No Organization'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        {scoreObj?.overall_score ? (
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-slate-900">{scoreObj.overall_score}%</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 font-bold">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4">
                                                        {expertObj ? (
                                                            <div className="flex items-center gap-2">
                                                                {expertObj.photo_url ? (
                                                                    <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 border border-slate-100">
                                                                        <img src={expertObj.photo_url} alt={expertObj.full_name} className="h-full w-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                                                        <Users className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                                <span className="font-bold text-slate-600 text-sm">{expertObj.full_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <span className="font-bold text-slate-500 text-sm">{completionDate}</span>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <aside className="col-span-12 lg:col-span-4 space-y-8">
                        <div className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <TrendingUp className="h-32 w-32" />
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-xl font-black mb-4 tracking-tight">System Health</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Database</span>
                                        <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">Connected</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Storage</span>
                                        <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">Active</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10">
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Auth Service</span>
                                        <span className="text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">Synced</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
