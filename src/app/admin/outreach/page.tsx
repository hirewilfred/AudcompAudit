'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    Megaphone, Zap, Users2, Calendar, Plus, Loader2, ArrowRight, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function OutreachDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/auth'); return; }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single() as any;

            if (!profileData?.is_admin) { router.push('/admin'); return; }

            const { data } = await (supabase.from('outreach_campaigns') as any)
                .select('*, ams_clients(company_name)')
                .order('updated_at', { ascending: false });

            setCampaigns(data || []);
            setLoading(false);
        }
        load();
    }, []);

    const activeCampaigns = campaigns.filter(c => c.status === 'active');
    const totalLeads = campaigns.reduce((s, c) => s + (c.stats_researched || 0), 0);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    // Booked this month: sum stats_booked from campaigns updated this month (approximation via stats counter)
    const totalBooked = campaigns.reduce((s, c) => s + (c.stats_booked || 0), 0);

    const totalContacted = campaigns.reduce((s, c) => s + (c.stats_contacted || 0), 0);
    const totalReplied = campaigns.reduce((s, c) => s + (c.stats_replied || 0), 0);
    const avgReplyRate = totalContacted > 0 ? Math.round((totalReplied / totalContacted) * 100) : 0;

    const statusBadge = (s: string) => {
        const map: Record<string, string> = {
            active: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
            paused: 'bg-amber-50 text-amber-700 border border-amber-100',
            completed: 'bg-slate-100 text-slate-500 border border-slate-200',
            draft: 'bg-slate-50 text-slate-500 border border-slate-200',
        };
        return map[s] || map.draft;
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />
            <main className="pl-64 pr-10 pt-10 pb-20">
                {/* Header */}
                <header className="flex items-end justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                            <CheckCircle2 className="h-3 w-3" /> AI Outreach Active
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Outreach Dashboard</h1>
                        <p className="text-slate-400 font-medium mt-2 text-sm">22-Agent Sales Pipeline — Live Overview</p>
                    </div>
                    <Link href="/admin/outreach/campaigns/new"
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                        <Plus className="h-4 w-4" /> New Campaign
                    </Link>
                </header>

                {/* Stat Cards */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 mb-8">
                    <h2 className="text-lg font-black text-slate-900 mb-6">Pipeline Summary</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
                            <Megaphone className="absolute top-3 right-3 h-10 w-10 text-slate-100" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Active Campaigns</p>
                            <p className="text-4xl font-black text-slate-900 tabular-nums">{activeCampaigns.length}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{campaigns.length} total</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden">
                            <Users2 className="absolute top-3 right-3 h-10 w-10 text-slate-100" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Leads</p>
                            <p className="text-4xl font-black text-slate-900 tabular-nums">{totalLeads.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{totalContacted} contacted</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className={`rounded-2xl p-5 border relative overflow-hidden ${totalBooked > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                            <Calendar className={`absolute top-3 right-3 h-10 w-10 ${totalBooked > 0 ? 'text-emerald-100' : 'text-slate-100'}`} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Meetings Booked</p>
                            <p className={`text-4xl font-black tabular-nums ${totalBooked > 0 ? 'text-emerald-600' : 'text-slate-900'}`}>{totalBooked}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">All time</p>
                        </motion.div>

                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className={`rounded-2xl p-5 border relative overflow-hidden ${avgReplyRate > 0 ? 'bg-blue-50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                            <Zap className={`absolute top-3 right-3 h-10 w-10 ${avgReplyRate > 0 ? 'text-blue-100' : 'text-slate-100'}`} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Avg Reply Rate</p>
                            <p className={`text-4xl font-black tabular-nums ${avgReplyRate > 0 ? 'text-blue-600' : 'text-slate-900'}`}>{avgReplyRate}%</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{totalReplied} replies / {totalContacted} sent</p>
                        </motion.div>
                    </div>
                </div>

                {/* Campaigns Table */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Campaigns</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">All outreach campaigns and their pipeline stats</p>
                        </div>
                        <Link href="/admin/outreach/campaigns" className="text-blue-600 font-black text-sm flex items-center gap-1 hover:gap-2 transition-all">
                            All Campaigns <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {campaigns.length === 0 ? (
                        <div className="text-center py-20">
                            <Megaphone className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No campaigns yet.</p>
                            <Link href="/admin/outreach/campaigns/new" className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 transition-all">
                                <Plus className="h-4 w-4" /> Create your first campaign
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        {['Campaign', 'Client', 'Status', 'Researched', 'Contacted', 'Replied', 'Booked', 'Last Updated', ''].map(h => (
                                            <th key={h} className="py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map(c => (
                                        <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-4 px-3">
                                                <p className="font-bold text-slate-900 text-xs">{c.name}</p>
                                            </td>
                                            <td className="py-4 px-3 text-xs text-slate-500 font-medium">
                                                {c.ams_clients?.company_name || <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="py-4 px-3">
                                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase ${statusBadge(c.status)}`}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-3 font-bold text-slate-700 tabular-nums text-center">{c.stats_researched || 0}</td>
                                            <td className="py-4 px-3 font-bold text-slate-700 tabular-nums text-center">{c.stats_contacted || 0}</td>
                                            <td className="py-4 px-3 font-bold text-slate-700 tabular-nums text-center">{c.stats_replied || 0}</td>
                                            <td className="py-4 px-3 font-bold text-emerald-600 tabular-nums text-center">{c.stats_booked || 0}</td>
                                            <td className="py-4 px-3 text-xs text-slate-400 font-medium whitespace-nowrap">
                                                {new Date(c.updated_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                                            </td>
                                            <td className="py-4 px-3">
                                                <Link href={`/admin/outreach/campaigns/${c.id}`}
                                                    className="text-blue-600 hover:text-blue-800 transition-colors">
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
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
