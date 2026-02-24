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
    ShieldAlert
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

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function checkAdmin() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/auth');
                    return;
                }

                const { data: profile, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single() as any;

                if (error || !profile?.is_admin) {
                    setIsAdmin(false);
                } else {
                    setIsAdmin(true);
                    // Fetch stats if admin
                    const [expertsRes, profilesRes, scoresRes] = await Promise.all([
                        supabase.from('experts').select('*', { count: 'exact', head: true }),
                        supabase.from('profiles').select('*', { count: 'exact', head: true }),
                        supabase.from('audit_scores').select('*', { count: 'exact', head: true })
                    ]);

                    setStats({
                        totalExperts: expertsRes.count || 0,
                        totalProfiles: profilesRes.count || 0,
                        totalAudits: scoresRes.count || 0
                    });
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
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] hover:bg-black transition-all flex items-center justify-center gap-2 group"
                    >
                        Return to Dashboard
                        <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </button>
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
                    <section className="col-span-12 lg:col-span-8 bg-white rounded-[48px] p-10 shadow-sm border border-slate-100 border-dashed min-h-[400px] flex flex-col items-center justify-center text-center">
                        <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                            <Users className="h-12 w-12" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Manage Your Expert Pool</h2>
                        <p className="text-slate-400 font-bold max-w-sm leading-relaxed mb-8">
                            Add or update experts displayed on the user dashboard. Include photos, LinkedIn profiles, and booking links.
                        </p>
                        <button
                            onClick={() => router.push('/admin/experts')}
                            className="bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 group"
                        >
                            Manage Experts
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
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
