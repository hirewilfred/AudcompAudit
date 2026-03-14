'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    Megaphone, ArrowLeft, Loader2, Settings, Users2,
    ChevronDown, ChevronUp, CheckCircle2, AlertTriangle,
    Search, Send, X
} from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_COLORS: Record<string, string> = {
    researched: 'bg-slate-100 text-slate-600',
    contacted: 'bg-blue-50 text-blue-600',
    replied: 'bg-indigo-50 text-indigo-600',
    interested: 'bg-violet-50 text-violet-600',
    booked: 'bg-emerald-50 text-emerald-600',
    closed: 'bg-green-50 text-green-700',
    disqualified: 'bg-red-50 text-red-600',
};

const AGENT_COLORS: Record<string, string> = {
    'prospect-researcher': 'bg-blue-100 text-blue-700',
    'email-personalizer': 'bg-indigo-100 text-indigo-700',
    'reply-handler': 'bg-violet-100 text-violet-700',
    'meeting-booker': 'bg-emerald-100 text-emerald-700',
    'rep-handoff': 'bg-orange-100 text-orange-700',
};

const FUNNEL_STAGES = [
    { key: 'stats_researched', label: 'Researched', color: 'bg-slate-500' },
    { key: 'stats_contacted', label: 'Contacted', color: 'bg-blue-500' },
    { key: 'stats_replied', label: 'Replied', color: 'bg-indigo-500' },
    { key: 'stats_interested', label: 'Interested', color: 'bg-violet-500' },
    { key: 'stats_booked', label: 'Booked', color: 'bg-emerald-500' },
    { key: 'stats_closed', label: 'Closed', color: 'bg-green-600' },
];

function relativeTime(ts: string) {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export default function CampaignDetailPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [campaign, setCampaign] = useState<any>(null);
    const [leads, setLeads] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [expandedLead, setExpandedLead] = useState<string | null>(null);
    const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

    // Scrape state
    const [scraping, setScraping] = useState(false);
    const [scrapeResult, setScrapeResult] = useState<string | null>(null);

    // Instantly sync state
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [instantlyCampaigns, setInstantlyCampaigns] = useState<any[]>([]);
    const [loadingInstantly, setLoadingInstantly] = useState(false);
    const [selectedInstantlyCampaign, setSelectedInstantlyCampaign] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/auth'); return; }

            const [{ data: camp }, { data: leadsData }, { data: eventsData }] = await Promise.all([
                (supabase.from('outreach_campaigns') as any)
                    .select('*, ams_clients(company_name)')
                    .eq('id', id)
                    .single(),
                (supabase.from('outreach_leads') as any)
                    .select('*')
                    .eq('campaign_id', id)
                    .order('updated_at', { ascending: false }),
                (supabase.from('outreach_agent_events') as any)
                    .select('*')
                    .eq('campaign_id', id)
                    .order('occurred_at', { ascending: false })
                    .limit(50),
            ]);

            if (!camp) { router.push('/admin/outreach'); return; }
            setCampaign(camp);
            setLeads(leadsData || []);
            setEvents(eventsData || []);
            setLoading(false);
        }
        load();
    }, [id]);

    async function handleScrape() {
        setScraping(true);
        setScrapeResult(null);
        try {
            const res = await fetch('/api/outreach/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaign_id: id, limit: 100 }),
            });
            const json = await res.json();
            if (!res.ok) {
                setScrapeResult(`Error: ${json.error}`);
            } else {
                setScrapeResult(`Done — ${json.inserted} leads scraped.`);
                // Refresh leads
                const { data } = await (supabase.from('outreach_leads') as any)
                    .select('*').eq('campaign_id', id).order('updated_at', { ascending: false });
                setLeads(data || []);
            }
        } catch (e: any) {
            setScrapeResult(`Error: ${e.message}`);
        }
        setScraping(false);
    }

    async function openSyncModal() {
        setSyncModalOpen(true);
        setSyncResult(null);
        setSelectedInstantlyCampaign('');
        setLoadingInstantly(true);
        try {
            const res = await fetch('/api/outreach/instantly/campaigns');
            const json = await res.json();
            setInstantlyCampaigns(json.campaigns || []);
        } catch {
            setInstantlyCampaigns([]);
        }
        setLoadingInstantly(false);
    }

    async function handleSync() {
        if (!selectedInstantlyCampaign) return;
        setSyncing(true);
        setSyncResult(null);
        try {
            const res = await fetch('/api/outreach/instantly/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaign_id: id, instantly_campaign_id: selectedInstantlyCampaign }),
            });
            const json = await res.json();
            if (!res.ok) {
                setSyncResult(`Error: ${json.error}`);
            } else {
                setSyncResult(`Done — ${json.synced} leads pushed to Instantly.`);
            }
        } catch (e: any) {
            setSyncResult(`Error: ${e.message}`);
        }
        setSyncing(false);
    }

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
    );

    const statusBadge = (s: string) => {
        const map: Record<string, string> = {
            active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            paused: 'bg-amber-50 text-amber-700 border-amber-100',
            completed: 'bg-slate-100 text-slate-500 border-slate-200',
            draft: 'bg-slate-50 text-slate-500 border-slate-200',
        };
        return map[s] || map.draft;
    };

    const top = campaign.stats_researched || 1; // avoid /0

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />
            <main className="pl-64 pr-10 pt-10 pb-20">
                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/outreach/campaigns"
                            className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{campaign.name}</h1>
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase ${statusBadge(campaign.status)}`}>
                                    {campaign.status}
                                </span>
                            </div>
                            <p className="text-slate-400 font-medium text-sm mt-0.5">
                                {campaign.ams_clients?.company_name || 'No client linked'} · Updated {relativeTime(campaign.updated_at)}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleScrape} disabled={scraping}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50">
                            {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                            {scraping ? 'Scraping...' : 'Scrape Leads'}
                        </button>
                        <button onClick={openSyncModal}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                            <Send className="h-4 w-4" /> Sync to Instantly
                        </button>
                        <Link href={`/admin/outreach/campaigns/${id}/settings`}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 shadow-sm transition-all">
                            <Settings className="h-4 w-4" /> Settings
                        </Link>
                    </div>
                </header>

                {/* Funnel */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 mb-6">
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Pipeline Funnel</h2>
                    <div className="grid grid-cols-6 gap-3">
                        {FUNNEL_STAGES.map((stage, i) => {
                            const count = campaign[stage.key] || 0;
                            const pct = i === 0 ? 100 : Math.round((count / top) * 100);
                            return (
                                <motion.div key={stage.key}
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="text-center">
                                    <div className="relative h-24 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 mb-2">
                                        <div className={`absolute bottom-0 left-0 right-0 ${stage.color} transition-all duration-500`}
                                            style={{ height: `${pct}%` }} />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-black text-white drop-shadow">{count}</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{stage.label}</p>
                                    {i > 0 && top > 0 && (
                                        <p className="text-[10px] text-slate-400 font-bold">{pct}%</p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Feed + Leads */}
                <div className="grid grid-cols-12 gap-6">
                    {/* Agent Activity Feed */}
                    <div className="col-span-12 lg:col-span-4">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Megaphone className="h-4 w-4 text-blue-500" /> Agent Activity
                            </h2>
                            {events.length === 0 ? (
                                <div className="text-center py-12">
                                    <Megaphone className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold text-sm">No agent events yet.</p>
                                    <p className="text-slate-300 text-xs mt-1">The 22-agent system will log activity here.</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                                    {events.map(ev => {
                                        const agentColor = AGENT_COLORS[ev.agent_id] || 'bg-slate-100 text-slate-600';
                                        const isExpanded = expandedEvent === ev.id;
                                        const statusIcon = ev.status === 'error'
                                            ? <AlertTriangle className="h-3 w-3 text-red-500 shrink-0" />
                                            : ev.status === 'warning'
                                                ? <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                                : <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />;
                                        return (
                                            <div key={ev.id}
                                                className="p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors"
                                                onClick={() => setExpandedEvent(isExpanded ? null : ev.id)}>
                                                <div className="flex items-start gap-2">
                                                    {statusIcon}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase ${agentColor}`}>
                                                                {ev.agent_display_name || ev.agent_id}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-bold">{relativeTime(ev.occurred_at)}</span>
                                                        </div>
                                                        <p className="text-xs font-medium text-slate-700 leading-tight">{ev.summary}</p>
                                                        {isExpanded && ev.details && Object.keys(ev.details).length > 0 && (
                                                            <pre className="mt-2 text-[10px] bg-white border border-slate-100 rounded-lg p-2 overflow-x-auto text-slate-600 font-mono">
                                                                {JSON.stringify(ev.details, null, 2)}
                                                            </pre>
                                                        )}
                                                    </div>
                                                    {isExpanded ? <ChevronUp className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" /> : <ChevronDown className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Leads Table */}
                    <div className="col-span-12 lg:col-span-8">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Users2 className="h-4 w-4 text-blue-500" /> Leads
                                    <span className="text-slate-400 font-bold">{leads.length}</span>
                                </h2>
                            </div>
                            {leads.length === 0 ? (
                                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <Users2 className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold text-sm">No leads yet.</p>
                                    <p className="text-slate-300 text-xs mt-1">The agent system will populate leads here.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                {['Company', 'Contact', 'Title', 'Status', 'Source', 'Last Touch', 'Next Action'].map(h => (
                                                    <th key={h} className="py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leads.map(lead => {
                                                const isExp = expandedLead === lead.id;
                                                return (
                                                    <>
                                                        <tr key={lead.id}
                                                            className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                                                            onClick={() => setExpandedLead(isExp ? null : lead.id)}>
                                                            <td className="py-3 px-3">
                                                                <p className="font-bold text-slate-900 text-xs">{lead.company_name || '—'}</p>
                                                                {lead.company_domain && <p className="text-[10px] text-slate-400">{lead.company_domain}</p>}
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                <p className="font-medium text-xs text-slate-700">{lead.contact_name || '—'}</p>
                                                                {lead.contact_email && <p className="text-[10px] text-blue-500">{lead.contact_email}</p>}
                                                            </td>
                                                            <td className="py-3 px-3 text-xs text-slate-500 font-medium">{lead.contact_title || '—'}</td>
                                                            <td className="py-3 px-3">
                                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-500'}`}>
                                                                    {lead.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-3 text-xs text-slate-400 font-medium">{lead.source || '—'}</td>
                                                            <td className="py-3 px-3 text-xs text-slate-400 font-medium whitespace-nowrap">
                                                                {lead.last_touch_at ? relativeTime(lead.last_touch_at) : '—'}
                                                            </td>
                                                            <td className="py-3 px-3">
                                                                {lead.next_action_note
                                                                    ? <p className="text-xs text-slate-600 font-medium max-w-[140px] truncate">{lead.next_action_note}</p>
                                                                    : <span className="text-slate-300 text-xs">—</span>}
                                                                {lead.next_action_at && (
                                                                    <p className="text-[10px] text-slate-400 whitespace-nowrap">
                                                                        {new Date(lead.next_action_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                                                                    </p>
                                                                )}
                                                            </td>
                                                        </tr>
                                                        {isExp && (
                                                            <tr key={`${lead.id}-detail`} className="bg-slate-50/70">
                                                                <td colSpan={7} className="px-6 py-4">
                                                                    <div className="grid grid-cols-3 gap-6 text-xs">
                                                                        <div>
                                                                            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Contact</p>
                                                                            <p className="text-slate-700 font-medium">{lead.contact_name} · {lead.contact_title}</p>
                                                                            {lead.contact_email && <p className="text-blue-500">{lead.contact_email}</p>}
                                                                            {lead.contact_linkedin && (
                                                                                <a href={lead.contact_linkedin} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">LinkedIn →</a>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Timeline</p>
                                                                            {lead.researched_at && <p className="text-slate-600">Researched: {new Date(lead.researched_at).toLocaleDateString()}</p>}
                                                                            {lead.contacted_at && <p className="text-slate-600">Contacted: {new Date(lead.contacted_at).toLocaleDateString()}</p>}
                                                                            {lead.replied_at && <p className="text-slate-600">Replied: {new Date(lead.replied_at).toLocaleDateString()}</p>}
                                                                            {lead.booked_at && <p className="text-emerald-600 font-bold">Meeting booked: {new Date(lead.booked_at).toLocaleDateString()}</p>}
                                                                            {lead.meeting_url && (
                                                                                <a href={lead.meeting_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Join meeting →</a>
                                                                            )}
                                                                        </div>
                                                                        <div>
                                                                            <p className="font-black text-slate-400 uppercase tracking-widest text-[10px] mb-2">Notes</p>
                                                                            <p className="text-slate-600 whitespace-pre-wrap">{lead.notes || 'No notes.'}</p>
                                                                            {lead.assigned_rep && <p className="mt-2 text-slate-500 font-medium">Rep: {lead.assigned_rep}</p>}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Scrape result toast */}
                {scrapeResult && (
                    <div className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-3 ${scrapeResult.startsWith('Error') ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'}`}>
                        {scrapeResult.startsWith('Error') ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        {scrapeResult}
                        <button onClick={() => setScrapeResult(null)} className="ml-2 opacity-70 hover:opacity-100">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </main>

            {/* Instantly Sync Modal */}
            {syncModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] shadow-2xl p-8 w-full max-w-md mx-4">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Sync to Instantly</h2>
                                <p className="text-slate-400 text-sm font-medium mt-0.5">Push researched leads into an Instantly campaign</p>
                            </div>
                            <button onClick={() => setSyncModalOpen(false)} className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        {loadingInstantly ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : instantlyCampaigns.length === 0 ? (
                            <div className="text-center py-8 text-slate-400 font-medium text-sm">
                                No Instantly campaigns found. Check your API key.
                            </div>
                        ) : (
                            <div className="space-y-3 mb-6">
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    Select Instantly Campaign
                                </label>
                                <select
                                    value={selectedInstantlyCampaign}
                                    onChange={e => setSelectedInstantlyCampaign(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                    <option value="">— Choose a campaign —</option>
                                    {instantlyCampaigns.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-400 font-medium">
                                    Only leads with status &quot;researched&quot; and a valid email will be synced.
                                </p>
                            </div>
                        )}

                        {syncResult && (
                            <div className={`mb-4 px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 ${syncResult.startsWith('Error') ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                {syncResult.startsWith('Error') ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                {syncResult}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button onClick={() => setSyncModalOpen(false)}
                                className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-600 font-black text-sm hover:bg-slate-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={handleSync} disabled={syncing || !selectedInstantlyCampaign}
                                className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white font-black text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2">
                                {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                {syncing ? 'Syncing...' : 'Push Leads'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
