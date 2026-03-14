'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import { Zap, Plus, Loader2, ArrowRight, Settings } from 'lucide-react';

export default function CampaignsListPage() {
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
                .order('created_at', { ascending: false });

            setCampaigns(data || []);
            setLoading(false);
        }
        load();
    }, []);

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
                <header className="flex items-end justify-between mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Campaigns</h1>
                        <p className="text-slate-400 font-medium mt-2 text-sm">{campaigns.length} total campaigns</p>
                    </div>
                    <Link href="/admin/outreach/campaigns/new"
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                        <Plus className="h-4 w-4" /> New Campaign
                    </Link>
                </header>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    {campaigns.length === 0 ? (
                        <div className="text-center py-20">
                            <Zap className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No campaigns yet.</p>
                            <Link href="/admin/outreach/campaigns/new"
                                className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 transition-all">
                                <Plus className="h-4 w-4" /> Create your first campaign
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {campaigns.map(c => (
                                <div key={c.id} className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/20 transition-all group">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <p className="font-black text-slate-900 text-sm">{c.name}</p>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${statusBadge(c.status)}`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 font-medium">
                                            {c.ams_clients?.company_name || 'No client linked'} · Created {new Date(c.created_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>

                                    {/* Mini stats */}
                                    <div className="hidden lg:flex items-center gap-6 text-center">
                                        {[
                                            { label: 'Researched', val: c.stats_researched || 0 },
                                            { label: 'Contacted', val: c.stats_contacted || 0 },
                                            { label: 'Replied', val: c.stats_replied || 0 },
                                            { label: 'Booked', val: c.stats_booked || 0, highlight: true },
                                        ].map(stat => (
                                            <div key={stat.label}>
                                                <p className={`text-lg font-black tabular-nums ${stat.highlight ? 'text-emerald-600' : 'text-slate-700'}`}>{stat.val}</p>
                                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Link href={`/admin/outreach/campaigns/${c.id}/settings`}
                                            className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors">
                                            <Settings className="h-4 w-4" />
                                        </Link>
                                        <Link href={`/admin/outreach/campaigns/${c.id}`}
                                            className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors shadow-sm">
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
