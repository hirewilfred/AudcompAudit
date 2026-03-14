'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import { Users2, Loader2, ArrowRight } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
    researched: 'bg-slate-100 text-slate-600',
    contacted: 'bg-blue-50 text-blue-600',
    replied: 'bg-indigo-50 text-indigo-600',
    interested: 'bg-violet-50 text-violet-600',
    booked: 'bg-emerald-50 text-emerald-600',
    closed: 'bg-green-50 text-green-700',
    disqualified: 'bg-red-50 text-red-600',
};

const ALL_STATUSES = ['researched', 'contacted', 'replied', 'interested', 'booked', 'closed', 'disqualified'];

function relativeTime(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function AllLeadsPage() {
    const [loading, setLoading] = useState(true);
    const [leads, setLeads] = useState<any[]>([]);
    const [campaigns, setCampaigns] = useState<any[]>([]);
    const [filterCampaign, setFilterCampaign] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
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

            const [{ data: leadsData }, { data: campaignsData }] = await Promise.all([
                (supabase.from('outreach_leads') as any)
                    .select('*, outreach_campaigns(name)')
                    .order('updated_at', { ascending: false }),
                (supabase.from('outreach_campaigns') as any)
                    .select('id, name')
                    .order('name'),
            ]);

            setLeads(leadsData || []);
            setCampaigns(campaignsData || []);
            setLoading(false);
        }
        load();
    }, []);

    const filtered = leads.filter(l => {
        if (filterCampaign && l.campaign_id !== filterCampaign) return false;
        if (filterStatus && l.status !== filterStatus) return false;
        return true;
    });

    const totalBooked = leads.filter(l => l.status === 'booked' || l.status === 'closed').length;
    const totalContacted = leads.filter(l => ['contacted', 'replied', 'interested', 'booked', 'closed'].includes(l.status)).length;
    const totalReplied = leads.filter(l => ['replied', 'interested', 'booked', 'closed'].includes(l.status)).length;
    const avgReplyRate = totalContacted > 0 ? Math.round((totalReplied / totalContacted) * 100) : 0;

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
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">All Leads</h1>
                        <p className="text-slate-400 font-medium mt-2 text-sm">Cross-campaign prospect database</p>
                    </div>
                </header>

                {/* Stat bar */}
                <div className="grid grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Leads', value: leads.length, sub: `${filtered.length} shown` },
                        { label: 'Contacted', value: totalContacted, sub: `${leads.length - totalContacted} pending` },
                        { label: 'Booked / Closed', value: totalBooked, sub: 'Meetings + deals' },
                        { label: 'Reply Rate', value: `${avgReplyRate}%`, sub: `${totalReplied} replies` },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{stat.sub}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center gap-4 mb-6 flex-wrap">
                        <select
                            value={filterCampaign}
                            onChange={e => setFilterCampaign(e.target.value)}
                            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">All Campaigns</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>

                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setFilterStatus('')}
                                className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase transition-colors ${filterStatus === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                                All
                            </button>
                            {ALL_STATUSES.map(s => (
                                <button key={s}
                                    onClick={() => setFilterStatus(s === filterStatus ? '' : s)}
                                    className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase transition-colors ${filterStatus === s ? 'ring-2 ring-offset-1 ring-blue-400 ' + (STATUS_COLORS[s] || '') : STATUS_COLORS[s] || 'bg-slate-100 text-slate-500'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <Users2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No leads match your filters.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        {['Company', 'Contact', 'Title', 'Campaign', 'Status', 'Source', 'Last Touch', 'Next Action', ''].map(h => (
                                            <th key={h} className="py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(lead => (
                                        <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3 px-3">
                                                <p className="font-bold text-slate-900 text-xs">{lead.company_name || '—'}</p>
                                                {lead.company_domain && <p className="text-[10px] text-slate-400">{lead.company_domain}</p>}
                                            </td>
                                            <td className="py-3 px-3">
                                                <p className="font-medium text-xs text-slate-700">{lead.contact_name || '—'}</p>
                                                {lead.contact_email && <p className="text-[10px] text-blue-500">{lead.contact_email}</p>}
                                            </td>
                                            <td className="py-3 px-3 text-xs text-slate-500 font-medium">{lead.contact_title || '—'}</td>
                                            <td className="py-3 px-3 text-xs text-slate-500 font-medium">
                                                {lead.outreach_campaigns?.name
                                                    ? <Link href={`/admin/outreach/campaigns/${lead.campaign_id}`} className="hover:text-blue-600 transition-colors">{lead.outreach_campaigns.name}</Link>
                                                    : '—'}
                                            </td>
                                            <td className="py-3 px-3">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-500'}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-3 text-xs text-slate-400 font-medium">{lead.source || '—'}</td>
                                            <td className="py-3 px-3 text-xs text-slate-400 font-medium whitespace-nowrap">
                                                {lead.last_touch_at ? relativeTime(lead.last_touch_at) : '—'}
                                            </td>
                                            <td className="py-3 px-3 text-xs text-slate-600 font-medium max-w-[140px] truncate">
                                                {lead.next_action_note || <span className="text-slate-300">—</span>}
                                            </td>
                                            <td className="py-3 px-3">
                                                <Link href={`/admin/outreach/campaigns/${lead.campaign_id}`}
                                                    className="text-blue-500 hover:text-blue-700 transition-colors">
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
