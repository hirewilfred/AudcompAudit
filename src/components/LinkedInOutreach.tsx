import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Loader2, Search, Download, RefreshCw, Send, Plus, Zap, Key,
    CheckCircle2, ExternalLink, Users, UserPlus, MessageCircle,
    Clock, ArrowRight, Eye, Trash2, Filter, ChevronDown, Save,
    Target, Sparkles, Globe, Building2, MapPin, Mail,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types ───
type PipelineStage = 'scraped' | 'enriched' | 'connect_sent' | 'connected' | 'message_sent' | 'replied' | 'converted';

interface LinkedInLead {
    id: string;
    first_name: string;
    last_name: string;
    title: string;
    company: string;
    location: string;
    linkedin_url: string;
    email: string;
    headline: string;
    profile_image_url: string;
    industry: string;
    connections: number;
    stage: PipelineStage;
    campaign_id: string | null;
    notes: string;
    created_at: string;
    updated_at: string;
    selected?: boolean;
}

interface LinkedInCampaign {
    id: string;
    name: string;
    status: 'draft' | 'active' | 'paused' | 'completed';
    connection_message: string;
    followup_1: string;
    followup_1_delay_days: number;
    followup_2: string;
    followup_2_delay_days: number;
    leads_count: number;
    connected_count: number;
    replied_count: number;
    created_at: string;
}

// Pre-configured Apify actors for LinkedIn scraping/enrichment
const LINKEDIN_ACTORS = [
    {
        id: 'anchor/linkedin-people-search-scraper',
        label: 'LinkedIn People Search',
        desc: 'Search LinkedIn profiles by keywords, title, location',
        template: JSON.stringify({
            searchTerms: ['IT Director Toronto'],
            maxItems: 50,
            proxy: { useApifyProxy: true },
        }, null, 2),
    },
    {
        id: 'apify/linkedin-profile-scraper',
        label: 'LinkedIn Profile Scraper',
        desc: 'Scrape detailed profile data from LinkedIn URLs',
        template: JSON.stringify({
            searchTerms: ['CTO SaaS Toronto'],
            maxItems: 25,
        }, null, 2),
    },
    {
        id: 'curious_coder/linkedin-sales-navigator-scraper',
        label: 'Sales Navigator Export',
        desc: 'Export leads from LinkedIn Sales Navigator searches',
        template: JSON.stringify({
            searchUrl: 'https://www.linkedin.com/sales/search/people?query=...',
            maxItems: 50,
        }, null, 2),
    },
    {
        id: 'apify/google-search-scraper',
        label: 'Google → LinkedIn Profiles',
        desc: 'Find LinkedIn profiles via Google search',
        template: JSON.stringify({
            queries: 'site:linkedin.com/in "IT Manager" "Toronto"',
            maxPagesPerQuery: 3,
            resultsPerPage: 50,
        }, null, 2),
    },
    {
        id: 'curious_coder/apollo-io-scraper',
        label: 'Apollo.io Enrichment',
        desc: 'Enrich leads with Apollo.io data (emails, phone, company)',
        template: JSON.stringify({
            personTitles: ['IT Director', 'CTO', 'VP Technology'],
            industry: 'Information Technology',
            employeesRange: '11-50',
            location: 'Canada',
            maxResults: 50,
        }, null, 2),
    },
    {
        id: 'custom',
        label: 'Custom Actor',
        desc: 'Enter any Apify actor ID',
        template: '{\n  \n}',
    },
];

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string; bg: string; border: string; icon: any }> = {
    scraped: { label: 'Scraped', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Target },
    enriched: { label: 'Enriched', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: Sparkles },
    connect_sent: { label: 'Connect Sent', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', icon: UserPlus },
    connected: { label: 'Connected', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
    message_sent: { label: 'Message Sent', color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: MessageCircle },
    replied: { label: 'Replied', color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', icon: Send },
    converted: { label: 'Converted', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: CheckCircle2 },
};

const PIPELINE_ORDER: PipelineStage[] = ['scraped', 'enriched', 'connect_sent', 'connected', 'message_sent', 'replied', 'converted'];

// ─── Message templates ───
const CONNECTION_TEMPLATES = [
    {
        name: 'AI Readiness',
        message: `Hi {{first_name}}, I noticed you're leading {{company}}'s tech initiatives. We help companies like yours implement AI agents that automate repetitive work — would love to connect and share some insights.`,
    },
    {
        name: 'Mutual Value',
        message: `Hi {{first_name}}, I came across your profile and was impressed by your work at {{company}}. I'm working with similar companies on AI automation — thought there might be some synergy. Let's connect!`,
    },
    {
        name: 'Direct Offer',
        message: `Hi {{first_name}}, Audcomp is helping businesses like {{company}} save 10+ hours/week with agentic AI. Would love to show you a quick demo — worth connecting?`,
    },
];

const FOLLOWUP_TEMPLATES = [
    {
        name: 'Value-first',
        message: `Thanks for connecting, {{first_name}}! I put together a quick AI readiness checklist that's been really useful for {{industry}} companies. Want me to send it over? No strings attached.`,
    },
    {
        name: 'Case Study',
        message: `Great to be connected, {{first_name}}! We recently helped a {{industry}} company cut their manual processing time by 90% with an AI agent. Happy to share the case study if you're curious.`,
    },
    {
        name: 'Meeting Ask',
        message: `Hey {{first_name}}, thanks for accepting! I'd love to learn more about what {{company}} is working on and see if there's a fit. Got 15 minutes this week for a quick chat?`,
    },
];

// ─── Main Component ───
const LinkedInOutreach: React.FC = () => {
    const { user } = useAuth();

    // View state
    const [activeView, setActiveView] = useState<'pipeline' | 'scraper' | 'campaigns'>('pipeline');

    // Apify state
    const [apifyKey, setApifyKey] = useState('');
    const [apifySaving, setApifySaving] = useState(false);
    const [selectedActor, setSelectedActor] = useState(LINKEDIN_ACTORS[0].id);
    const [customActorId, setCustomActorId] = useState('');
    const [actorInput, setActorInput] = useState(LINKEDIN_ACTORS[0].template);
    const [scrapeLoading, setScrapeLoading] = useState(false);
    const [scrapeError, setScrapeError] = useState<string | null>(null);

    // Leads state
    const [leads, setLeads] = useState<LinkedInLead[]>([]);
    const [leadsLoading, setLeadsLoading] = useState(true);
    const [leadSearch, setLeadSearch] = useState('');
    const [stageFilter, setStageFilter] = useState<PipelineStage | 'all'>('all');

    // Campaigns state
    const [campaigns, setCampaigns] = useState<LinkedInCampaign[]>([]);
    const [campaignsLoading, setCampaignsLoading] = useState(true);
    const [showNewCampaign, setShowNewCampaign] = useState(false);
    const [newCampaign, setNewCampaign] = useState({
        name: '',
        connection_message: CONNECTION_TEMPLATES[0].message,
        followup_1: FOLLOWUP_TEMPLATES[0].message,
        followup_1_delay_days: 2,
        followup_2: FOLLOWUP_TEMPLATES[2].message,
        followup_2_delay_days: 3,
    });
    const [savingCampaign, setSavingCampaign] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
    const [viewingCampaignId, setViewingCampaignId] = useState<string | null>(null);

    // LinkedIn sending state
    const [liCookie, setLiCookie] = useState('');
    const [liCookieSaved, setLiCookieSaved] = useState(false);
    const [sendingCampaignId, setSendingCampaignId] = useState<string | null>(null);
    const [sendProgress, setSendProgress] = useState<{ sent: number; total: number; errors: string[] }>({ sent: 0, total: 0, errors: [] });
    const [sendComplete, setSendComplete] = useState(false);

    // Bulk selection
    const selectedLeads = leads.filter(l => l.selected);

    // Load Apify key: prefer env var, fallback to user metadata
    useEffect(() => {
        const envKey = process.env.NEXT_PUBLIC_APIFY_API_KEY || process.env.VITE_APIFY_API_KEY;
        if (envKey) {
            setApifyKey(envKey);
        } else if (user?.user_metadata?.apify_api_key) {
            setApifyKey(user.user_metadata.apify_api_key);
        }
        // Load LinkedIn cookie from user metadata
        if (user?.user_metadata?.li_at_cookie) {
            setLiCookie(user.user_metadata.li_at_cookie);
            setLiCookieSaved(true);
        }
    }, [user]);

    // Save LinkedIn cookie to user metadata
    const saveLiCookie = async () => {
        if (!supabase || !liCookie.trim()) return;
        await supabase.auth.updateUser({ data: { li_at_cookie: liCookie } });
        setLiCookieSaved(true);
    };

    // Send LinkedIn connection requests for a campaign
    const sendLinkedInConnections = async (campaignId: string) => {
        const campaign = campaigns.find(c => c.id === campaignId);
        if (!campaign || !liCookie) return;

        const campaignLeads = leads.filter(l => l.campaign_id === campaignId && l.linkedin_url && l.stage === 'scraped');
        if (campaignLeads.length === 0) return;

        setSendingCampaignId(campaignId);
        setSendProgress({ sent: 0, total: campaignLeads.length, errors: [] });
        setSendComplete(false);

        const errors: string[] = [];
        let sentCount = 0;

        for (const lead of campaignLeads) {
            try {
                // Extract profile identifier from LinkedIn URL
                const profileMatch = lead.linkedin_url.match(/linkedin\.com\/in\/([^/?]+)/);
                if (!profileMatch) {
                    errors.push(`${lead.first_name} ${lead.last_name}: invalid LinkedIn URL`);
                    continue;
                }
                const profileId = profileMatch[1];

                // Personalize the connection message
                const message = campaign.connection_message
                    .replace(/\{\{first_name\}\}/g, lead.first_name)
                    .replace(/\{\{last_name\}\}/g, lead.last_name)
                    .replace(/\{\{company\}\}/g, lead.company || '')
                    .replace(/\{\{title\}\}/g, lead.title || '')
                    .replace(/\{\{industry\}\}/g, lead.industry || '');

                // First: get the profile's public ID / member URN
                const profileRes = await fetch(`https://www.linkedin.com/voyager/api/identity/profiles/${profileId}`, {
                    headers: {
                        'cookie': `li_at=${liCookie}`,
                        'csrf-token': liCookie.substring(0, 20),
                        'x-restli-protocol-version': '2.0.0',
                    },
                });

                if (!profileRes.ok) {
                    errors.push(`${lead.first_name} ${lead.last_name}: profile fetch failed (${profileRes.status})`);
                    continue;
                }

                const profileData = await profileRes.json();
                const entityUrn = profileData.entityUrn || profileData.miniProfile?.entityUrn || `urn:li:fsd_profile:${profileId}`;
                const memberId = entityUrn.split(':').pop();

                // Send connection request via Voyager API
                const connectRes = await fetch('https://www.linkedin.com/voyager/api/voyagerRelationshipsDashMemberRelationships?action=verifyQuotaAndCreate', {
                    method: 'POST',
                    headers: {
                        'cookie': `li_at=${liCookie}`,
                        'csrf-token': liCookie.substring(0, 20),
                        'x-restli-protocol-version': '2.0.0',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        inviteeProfileUrn: `urn:li:fsd_profile:${memberId}`,
                        customMessage: message.substring(0, 300), // LinkedIn enforces 300 char limit
                    }),
                });

                if (connectRes.ok || connectRes.status === 201) {
                    sentCount++;
                    // Update lead stage
                    if (supabase) {
                        await supabase.from('linkedin_leads').update({ stage: 'connect_sent', updated_at: new Date().toISOString() }).eq('id', lead.id);
                    }
                    setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: 'connect_sent' as PipelineStage } : l));
                } else {
                    const errText = await connectRes.text().catch(() => '');
                    errors.push(`${lead.first_name} ${lead.last_name}: send failed (${connectRes.status}) ${errText.slice(0, 100)}`);
                }
            } catch (err: any) {
                errors.push(`${lead.first_name} ${lead.last_name}: ${err.message}`);
            }

            setSendProgress({ sent: sentCount, total: campaignLeads.length, errors: [...errors] });

            // Rate limit: wait 8-15 seconds between requests to mimic human behavior
            if (campaignLeads.indexOf(lead) < campaignLeads.length - 1) {
                await new Promise(r => setTimeout(r, 8000 + Math.random() * 7000));
            }
        }

        setSendComplete(true);
        setSendingCampaignId(null);
    };

    // Load leads from Supabase
    const fetchLeads = useCallback(async () => {
        if (!supabase || !user) return;
        setLeadsLoading(true);
        const { data } = await supabase
            .from('linkedin_leads')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });
        setLeads((data || []).map((l: any) => ({ ...l, selected: false })));
        setLeadsLoading(false);
    }, [user]);

    // Load campaigns from Supabase
    const fetchCampaigns = useCallback(async () => {
        if (!supabase || !user) return;
        setCampaignsLoading(true);
        const { data } = await supabase
            .from('linkedin_campaigns')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });
        setCampaigns((data || []) as LinkedInCampaign[]);
        setCampaignsLoading(false);
    }, [user]);

    useEffect(() => { fetchLeads(); fetchCampaigns(); }, [fetchLeads, fetchCampaigns]);

    // Save Apify key
    const saveApifyKey = async () => {
        if (!supabase) return;
        setApifySaving(true);
        await supabase.auth.updateUser({ data: { apify_api_key: apifyKey } });
        setTimeout(() => setApifySaving(false), 1500);
    };

    // Run scraper and save leads to DB
    const runScraper = async () => {
        if (!apifyKey) { setScrapeError('Enter your Apify API key first.'); return; }
        const actorId = selectedActor === 'custom' ? customActorId : selectedActor;
        if (!actorId) { setScrapeError('Enter a custom actor ID.'); return; }
        let parsedInput: any;
        try { parsedInput = JSON.parse(actorInput); } catch { setScrapeError('Invalid JSON input.'); return; }

        setScrapeLoading(true);
        setScrapeError(null);
        try {
            const res = await fetch(
                `https://api.apify.com/v2/acts/${encodeURIComponent(actorId)}/run-sync-get-dataset-items?token=${apifyKey}&timeout=120`,
                { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsedInput) }
            );
            if (!res.ok) throw new Error(`Apify returned ${res.status}`);
            const items: any[] = await res.json();

            const newLeads = items.map((item: any) => ({
                owner_id: user!.id,
                first_name: item.firstName || item.first_name || (item.name || '').split(' ')[0] || '',
                last_name: item.lastName || item.last_name || (item.name || '').split(' ').slice(1).join(' ') || '',
                title: item.title || item.jobTitle || item.headline || '',
                company: item.company || item.companyName || item.organization?.name || '',
                location: item.location || item.city || item.geo || '',
                linkedin_url: item.linkedinUrl || item.profileUrl || item.url || '',
                email: item.email || item.emails?.[0] || '',
                headline: item.headline || item.title || '',
                profile_image_url: item.profilePicture || item.avatar || item.imgUrl || '',
                industry: item.industry || '',
                connections: item.connectionsCount || item.connections || 0,
                stage: 'scraped' as PipelineStage,
                notes: `Scraped from ${actorId} on ${new Date().toLocaleDateString()}`,
            }));

            if (newLeads.length === 0) {
                setScrapeError('No leads found. Try different search parameters.');
            } else if (supabase) {
                // Upsert by linkedin_url to avoid duplicates
                const { error } = await supabase.from('linkedin_leads').upsert(
                    newLeads.filter(l => l.linkedin_url || l.email),
                    { onConflict: 'owner_id,linkedin_url', ignoreDuplicates: true }
                );
                if (error) {
                    // Fallback: insert without conflict handling
                    await supabase.from('linkedin_leads').insert(newLeads.filter(l => l.linkedin_url || l.email));
                }
                await fetchLeads();
            }
        } catch (e: any) {
            setScrapeError(e.message);
        } finally {
            setScrapeLoading(false);
        }
    };

    // Update lead stage
    const updateLeadStage = async (leadId: string, stage: PipelineStage) => {
        if (!supabase) return;
        await supabase.from('linkedin_leads').update({ stage, updated_at: new Date().toISOString() }).eq('id', leadId);
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage } : l));
    };

    // Bulk update stage
    const bulkUpdateStage = async (stage: PipelineStage) => {
        if (!supabase || selectedLeads.length === 0) return;
        const ids = selectedLeads.map(l => l.id);
        await supabase.from('linkedin_leads').update({ stage, updated_at: new Date().toISOString() }).in('id', ids);
        setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, stage, selected: false } : l));
    };

    // Assign leads to campaign
    const assignToCampaign = async (campaignId: string) => {
        if (!supabase || selectedLeads.length === 0) return;
        const ids = selectedLeads.map(l => l.id);
        await supabase.from('linkedin_leads').update({ campaign_id: campaignId }).in('id', ids);
        setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, campaign_id: campaignId, selected: false } : l));
    };

    // Delete leads
    const deleteSelectedLeads = async () => {
        if (!supabase || selectedLeads.length === 0) return;
        const ids = selectedLeads.map(l => l.id);
        await supabase.from('linkedin_leads').delete().in('id', ids);
        setLeads(prev => prev.filter(l => !ids.includes(l.id)));
    };

    // Create campaign
    const createCampaign = async () => {
        if (!supabase || !user || !newCampaign.name.trim()) return;
        setSavingCampaign(true);
        const { error } = await supabase.from('linkedin_campaigns').insert({
            owner_id: user.id,
            name: newCampaign.name,
            status: 'draft',
            connection_message: newCampaign.connection_message,
            followup_1: newCampaign.followup_1,
            followup_1_delay_days: newCampaign.followup_1_delay_days,
            followup_2: newCampaign.followup_2,
            followup_2_delay_days: newCampaign.followup_2_delay_days,
        });
        if (!error) {
            setShowNewCampaign(false);
            setNewCampaign({
                name: '',
                connection_message: CONNECTION_TEMPLATES[0].message,
                followup_1: FOLLOWUP_TEMPLATES[0].message,
                followup_1_delay_days: 2,
                followup_2: FOLLOWUP_TEMPLATES[2].message,
                followup_2_delay_days: 3,
            });
            await fetchCampaigns();
        }
        setSavingCampaign(false);
    };

    // Toggle campaign status
    const toggleCampaignStatus = async (id: string, current: string) => {
        if (!supabase) return;
        const next = current === 'active' ? 'paused' : 'active';
        await supabase.from('linkedin_campaigns').update({ status: next }).eq('id', id);
        setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: next as any } : c));
    };

    // Delete campaign
    const deleteCampaign = async (id: string) => {
        if (!supabase) return;
        await supabase.from('linkedin_campaigns').delete().eq('id', id);
        setCampaigns(prev => prev.filter(c => c.id !== id));
        if (selectedCampaignId === id) setSelectedCampaignId(null);
    };

    // Export leads CSV
    const exportCSV = () => {
        const rows = selectedLeads.length > 0 ? selectedLeads : leads;
        const csv = [
            'First Name,Last Name,Title,Company,Email,Location,LinkedIn URL,Stage',
            ...rows.map(l => `${l.first_name},${l.last_name},"${l.title}","${l.company}",${l.email},"${l.location}","${l.linkedin_url}",${l.stage}`)
        ].join('\n');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `linkedin-leads-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    // Filtered leads
    const filteredLeads = leads.filter(l => {
        const matchSearch = !leadSearch ||
            `${l.first_name} ${l.last_name}`.toLowerCase().includes(leadSearch.toLowerCase()) ||
            l.company?.toLowerCase().includes(leadSearch.toLowerCase()) ||
            l.title?.toLowerCase().includes(leadSearch.toLowerCase());
        const matchStage = stageFilter === 'all' || l.stage === stageFilter;
        return matchSearch && matchStage;
    });

    // Pipeline counts
    const stageCounts = PIPELINE_ORDER.reduce((acc, stage) => {
        acc[stage] = leads.filter(l => l.stage === stage).length;
        return acc;
    }, {} as Record<PipelineStage, number>);

    const views = [
        { id: 'pipeline' as const, label: 'Pipeline', icon: Target },
        { id: 'scraper' as const, label: 'Scrape & Enrich', icon: Zap },
        { id: 'campaigns' as const, label: 'Campaigns', icon: Send },
    ];

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

            {/* Sub-navigation */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                    {views.map(v => {
                        const Icon = v.icon;
                        return (
                            <button
                                key={v.id}
                                onClick={() => setActiveView(v.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === v.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Icon className="h-4 w-4" /> {v.label}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-3">
                    {leads.length > 0 && (
                        <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all">
                            <Download className="h-3.5 w-3.5" />
                            Export {selectedLeads.length > 0 ? `(${selectedLeads.length})` : `(${leads.length})`}
                        </button>
                    )}
                    <button onClick={() => { fetchLeads(); fetchCampaigns(); }} className="p-2 text-slate-400 hover:text-white transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* ═══════════════════════ PIPELINE VIEW ═══════════════════════ */}
            {activeView === 'pipeline' && (
                <>
                    {/* Pipeline funnel */}
                    <div className="grid grid-cols-7 gap-2">
                        {PIPELINE_ORDER.map((stage) => {
                            const cfg = STAGE_CONFIG[stage];
                            const Icon = cfg.icon;
                            const count = stageCounts[stage];
                            const isActive = stageFilter === stage;
                            return (
                                <button
                                    key={stage}
                                    onClick={() => setStageFilter(isActive ? 'all' : stage)}
                                    className={`rounded-xl p-3 border transition-all text-center ${isActive ? `${cfg.bg} ${cfg.border} border-2` : 'bg-white/3 border-white/5 hover:border-white/15'}`}
                                >
                                    <Icon className={`h-5 w-5 mx-auto mb-1 ${cfg.color}`} />
                                    <div className={`text-2xl font-black ${cfg.color}`}>{count}</div>
                                    <div className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-1">{cfg.label}</div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Bulk actions bar */}
                    {selectedLeads.length > 0 && (
                        <div className="flex items-center gap-3 p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl flex-wrap">
                            <span className="text-sm font-bold text-indigo-300">{selectedLeads.length} selected</span>
                            <div className="h-4 w-px bg-white/10" />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Move to:</span>
                            {PIPELINE_ORDER.map(stage => (
                                <button key={stage} onClick={() => bulkUpdateStage(stage)} className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${STAGE_CONFIG[stage].bg} ${STAGE_CONFIG[stage].border} ${STAGE_CONFIG[stage].color} hover:opacity-80`}>
                                    {STAGE_CONFIG[stage].label}
                                </button>
                            ))}
                            <div className="h-4 w-px bg-white/10" />
                            {campaigns.length > 0 && (
                                <select
                                    onChange={e => { if (e.target.value) assignToCampaign(e.target.value); }}
                                    defaultValue=""
                                    className="text-xs font-bold bg-white/5 border border-white/10 text-slate-300 rounded-lg px-3 py-1.5"
                                >
                                    <option value="">Assign to Campaign...</option>
                                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            )}
                            <button onClick={deleteSelectedLeads} className="ml-auto text-xs font-bold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 transition-all">
                                <Trash2 className="h-3 w-3 inline mr-1" /> Delete
                            </button>
                        </div>
                    )}

                    {/* Search & filter */}
                    <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text" value={leadSearch} onChange={e => setLeadSearch(e.target.value)}
                                placeholder="Search by name, company, or title..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50"
                            />
                        </div>
                        {stageFilter !== 'all' && (
                            <button onClick={() => setStageFilter('all')} className="text-xs font-bold text-slate-400 hover:text-white px-3 py-2 bg-white/5 border border-white/10 rounded-xl transition-all">
                                Clear Filter
                            </button>
                        )}
                    </div>

                    {/* Leads table */}
                    <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                        {leadsLoading ? (
                            <div className="flex items-center justify-center h-48"><Loader2 className="h-7 w-7 text-indigo-500 animate-spin" /></div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <Users className="h-8 w-8 text-slate-600" />
                                <p className="text-sm text-slate-500 font-medium">
                                    {leads.length === 0 ? 'No leads yet. Go to "Scrape & Enrich" to start building your pipeline.' : 'No leads match your filter.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-white/10 bg-white/3">
                                            <th className="px-4 py-3 w-10">
                                                <input
                                                    type="checkbox"
                                                    onChange={e => setLeads(prev => prev.map(l => filteredLeads.find(f => f.id === l.id) ? { ...l, selected: e.target.checked } : l))}
                                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500"
                                                />
                                            </th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Company</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Stage</th>
                                            <th className="px-4 py-3 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredLeads.map(lead => {
                                            const stageCfg = STAGE_CONFIG[lead.stage];
                                            return (
                                                <tr key={lead.id} className={`transition-colors ${lead.selected ? 'bg-indigo-600/5' : 'hover:bg-white/2'}`}>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="checkbox" checked={!!lead.selected}
                                                            onChange={() => setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, selected: !l.selected } : l))}
                                                            className="w-4 h-4 rounded border-white/20 bg-white/5 text-indigo-500 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-black shrink-0">
                                                                {lead.first_name?.charAt(0) || 'L'}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
                                                                    {lead.first_name} {lead.last_name}
                                                                    {lead.linkedin_url && (
                                                                        <a href={lead.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-400 hover:text-blue-300">
                                                                            <ExternalLink className="h-3 w-3" />
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[200px]">{lead.title || 'No title'}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm text-slate-300 font-medium flex items-center gap-1.5">
                                                            <Building2 className="h-3 w-3 text-slate-500" />
                                                            {lead.company || '—'}
                                                        </div>
                                                        {lead.email && <div className="text-[10px] text-blue-400 mt-0.5">{lead.email}</div>}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="text-sm text-slate-400 flex items-center gap-1.5">
                                                            <MapPin className="h-3 w-3 text-slate-500" />
                                                            {lead.location || '—'}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <select
                                                            value={lead.stage}
                                                            onChange={e => updateLeadStage(lead.id, e.target.value as PipelineStage)}
                                                            className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${stageCfg.bg} ${stageCfg.border} ${stageCfg.color} bg-transparent outline-none cursor-pointer`}
                                                        >
                                                            {PIPELINE_ORDER.map(s => (
                                                                <option key={s} value={s} className="bg-[#0d1626] text-white">{STAGE_CONFIG[s].label}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex items-center gap-1">
                                                            {lead.linkedin_url && (
                                                                <a href={lead.linkedin_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all" title="View on LinkedIn">
                                                                    <Users className="h-3 w-3" />
                                                                </a>
                                                            )}
                                                            {lead.email && (
                                                                <a href={`mailto:${lead.email}`} className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all" title="Send email">
                                                                    <Mail className="h-3 w-3" />
                                                                </a>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ═══════════════════════ SCRAPER VIEW ═══════════════════════ */}
            {activeView === 'scraper' && (
                <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Zap className="h-4 w-4 text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-white">LinkedIn Scraper & Enrichment</h2>
                            <p className="text-xs text-slate-400">Use Apify actors to scrape LinkedIn profiles and enrich with contact data</p>
                        </div>
                    </div>
                    <div className="p-6 space-y-6">
                        {/* API Key */}
                        {(!apifyKey || apifySaving) ? (
                            <div className="flex gap-3 items-end">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-400 mb-2">Apify API Token</label>
                                    <div className="relative">
                                        <Key className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input type="password" value={apifyKey} onChange={e => setApifyKey(e.target.value)} placeholder="Enter Apify API Key..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50" />
                                    </div>
                                </div>
                                <button onClick={saveApifyKey} className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:text-white transition-all flex items-center gap-2">
                                    {apifySaving ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Key className="h-4 w-4" />}
                                    {apifySaving ? 'Saved' : 'Save Key'}
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-white/3 border border-white/5 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Key className="h-4 w-4 text-emerald-400" /></div>
                                    <div className="text-xs font-medium text-slate-300">Apify API key is configured</div>
                                </div>
                                <button onClick={() => setApifyKey('')} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Change</button>
                            </div>
                        )}

                        {/* Actor selector cards */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Choose a Scraper</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {LINKEDIN_ACTORS.map(actor => (
                                    <button
                                        key={actor.id}
                                        onClick={() => {
                                            setSelectedActor(actor.id);
                                            setActorInput(actor.template);
                                        }}
                                        className={`text-left p-4 rounded-xl border transition-all ${selectedActor === actor.id ? 'border-indigo-500/50 bg-indigo-600/10' : 'border-white/5 bg-white/3 hover:border-white/15'}`}
                                    >
                                        <div className="text-sm font-bold text-white mb-1">{actor.label}</div>
                                        <div className="text-[10px] text-slate-500 leading-relaxed">{actor.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Custom actor ID */}
                        {selectedActor === 'custom' && (
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-2">Custom Actor ID</label>
                                <input type="text" value={customActorId} onChange={e => setCustomActorId(e.target.value)} placeholder="e.g. username/actor-name"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50" />
                            </div>
                        )}

                        {/* Input JSON */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Actor Input (JSON)</label>
                            <textarea value={actorInput} onChange={e => setActorInput(e.target.value)} rows={6} spellCheck={false}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-500 outline-none focus:border-indigo-500/50 resize-none" />
                        </div>

                        {/* Run button */}
                        <button onClick={runScraper} disabled={scrapeLoading} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20">
                            {scrapeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                            {scrapeLoading ? 'Scraping LinkedIn...' : 'Run Scraper & Save to Pipeline'}
                        </button>

                        {scrapeError && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-sm text-red-400">{scrapeError}</div>}

                        {/* Quick tips */}
                        <div className="mt-4 p-5 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                            <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-3">LinkedIn Outreach Workflow</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                {[
                                    { step: '1', title: 'Scrape', desc: 'Use LinkedIn People Search or Sales Nav to find prospects' },
                                    { step: '2', title: 'Enrich', desc: 'Run Apollo.io scraper to add emails and company data' },
                                    { step: '3', title: 'Connect', desc: 'Send personalized LinkedIn connection requests' },
                                    { step: '4', title: 'Follow Up', desc: 'Send campaign messages and track replies' },
                                ].map(item => (
                                    <div key={item.step} className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-black shrink-0">{item.step}</div>
                                        <div>
                                            <div className="text-sm font-bold text-white">{item.title}</div>
                                            <div className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════ CAMPAIGNS VIEW ═══════════════════════ */}
            {activeView === 'campaigns' && (
                <div className="space-y-6">
                    {/* Header + New Campaign */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-white">LinkedIn Campaign Sequences</h2>
                            <p className="text-xs text-slate-400 mt-1">Build multi-step LinkedIn outreach sequences with personalized messaging</p>
                        </div>
                        <button onClick={() => setShowNewCampaign(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all">
                            <Plus className="h-4 w-4" /> New Campaign
                        </button>
                    </div>

                    {/* New Campaign Form */}
                    <AnimatePresence>
                        {showNewCampaign && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-indigo-500/20 overflow-hidden"
                            >
                                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                                    <h3 className="font-bold text-white">Create New Campaign</h3>
                                    <button onClick={() => setShowNewCampaign(false)} className="text-slate-400 hover:text-white"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Campaign name */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Campaign Name</label>
                                        <input type="text" value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="e.g. IT Directors Toronto Q2"
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50" />
                                    </div>

                                    {/* Sequence builder */}
                                    <div className="space-y-4">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Sequence Steps</label>

                                        {/* Step 1: Connection Request */}
                                        <div className="p-5 bg-white/3 border border-white/5 rounded-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center"><UserPlus className="h-4 w-4 text-amber-400" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">Step 1: Connection Request</div>
                                                    <div className="text-[10px] text-slate-500">Sent when you add leads to this campaign</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mb-2 flex-wrap">
                                                {CONNECTION_TEMPLATES.map(t => (
                                                    <button key={t.name} onClick={() => setNewCampaign(p => ({ ...p, connection_message: t.message }))}
                                                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${newCampaign.connection_message === t.message ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'text-slate-500 border-white/10 hover:text-white'}`}>
                                                        {t.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea value={newCampaign.connection_message} onChange={e => setNewCampaign(p => ({ ...p, connection_message: e.target.value }))} rows={3}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono resize-none outline-none focus:border-amber-500/50" />
                                            <div className="text-[10px] text-slate-600 mt-1">Variables: {'{{first_name}}'} {'{{last_name}}'} {'{{company}}'} {'{{title}}'} {'{{industry}}'}</div>
                                        </div>

                                        {/* Delay indicator */}
                                        <div className="flex items-center gap-3 px-6">
                                            <div className="flex-1 h-px bg-white/10" />
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                Wait
                                                <input type="number" min={1} max={14} value={newCampaign.followup_1_delay_days}
                                                    onChange={e => setNewCampaign(p => ({ ...p, followup_1_delay_days: Number(e.target.value) }))}
                                                    className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-white outline-none" />
                                                days after connected
                                            </div>
                                            <div className="flex-1 h-px bg-white/10" />
                                        </div>

                                        {/* Step 2: First Follow-up */}
                                        <div className="p-5 bg-white/3 border border-white/5 rounded-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center"><MessageCircle className="h-4 w-4 text-violet-400" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">Step 2: First Message</div>
                                                    <div className="text-[10px] text-slate-500">Sent after connection is accepted</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mb-2 flex-wrap">
                                                {FOLLOWUP_TEMPLATES.map(t => (
                                                    <button key={t.name} onClick={() => setNewCampaign(p => ({ ...p, followup_1: t.message }))}
                                                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${newCampaign.followup_1 === t.message ? 'bg-violet-500/10 text-violet-400 border-violet-500/20' : 'text-slate-500 border-white/10 hover:text-white'}`}>
                                                        {t.name}
                                                    </button>
                                                ))}
                                            </div>
                                            <textarea value={newCampaign.followup_1} onChange={e => setNewCampaign(p => ({ ...p, followup_1: e.target.value }))} rows={3}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono resize-none outline-none focus:border-violet-500/50" />
                                        </div>

                                        {/* Delay indicator */}
                                        <div className="flex items-center gap-3 px-6">
                                            <div className="flex-1 h-px bg-white/10" />
                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                <Clock className="h-3 w-3" />
                                                Wait
                                                <input type="number" min={1} max={14} value={newCampaign.followup_2_delay_days}
                                                    onChange={e => setNewCampaign(p => ({ ...p, followup_2_delay_days: Number(e.target.value) }))}
                                                    className="w-12 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-center text-white outline-none" />
                                                days if no reply
                                            </div>
                                            <div className="flex-1 h-px bg-white/10" />
                                        </div>

                                        {/* Step 3: Second Follow-up */}
                                        <div className="p-5 bg-white/3 border border-white/5 rounded-xl">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center"><Send className="h-4 w-4 text-sky-400" /></div>
                                                <div>
                                                    <div className="text-sm font-bold text-white">Step 3: Follow-up Message</div>
                                                    <div className="text-[10px] text-slate-500">Final nudge if no response</div>
                                                </div>
                                            </div>
                                            <textarea value={newCampaign.followup_2} onChange={e => setNewCampaign(p => ({ ...p, followup_2: e.target.value }))} rows={3}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono resize-none outline-none focus:border-sky-500/50" />
                                        </div>
                                    </div>

                                    {/* Save */}
                                    <div className="flex justify-end">
                                        <button onClick={createCampaign} disabled={savingCampaign || !newCampaign.name.trim()} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20">
                                            {savingCampaign ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            Create Campaign
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Existing campaigns */}
                    {campaignsLoading ? (
                        <div className="flex items-center justify-center h-48"><Loader2 className="h-7 w-7 text-indigo-500 animate-spin" /></div>
                    ) : campaigns.length === 0 && !showNewCampaign ? (
                        <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 p-12 text-center">
                            <Send className="h-10 w-10 text-slate-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-white mb-2">No campaigns yet</h3>
                            <p className="text-sm text-slate-500 mb-6">Create your first LinkedIn outreach campaign with a multi-step sequence.</p>
                            <button onClick={() => setShowNewCampaign(true)} className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all">
                                <Plus className="h-4 w-4" /> Create First Campaign
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {campaigns.map(c => {
                                const leadsInCampaign = leads.filter(l => l.campaign_id === c.id);
                                const connected = leadsInCampaign.filter(l => ['connected', 'message_sent', 'replied', 'converted'].includes(l.stage)).length;
                                const replied = leadsInCampaign.filter(l => ['replied', 'converted'].includes(l.stage)).length;
                                const isSelected = selectedCampaignId === c.id;
                                const isViewing = viewingCampaignId === c.id;
                                return (
                                    <div key={c.id} className={`backdrop-blur-xl bg-slate-900/40 rounded-2xl border transition-all ${isSelected ? 'border-indigo-500/50 bg-indigo-600/5' : 'border-white/5 hover:border-white/15'}`}>
                                        {/* Campaign header card */}
                                        <div className="p-6 cursor-pointer" onClick={() => setSelectedCampaignId(isSelected ? null : c.id)}>
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <div className="text-base font-bold text-white">{c.name}</div>
                                                    <div className="text-[10px] text-slate-500 mt-1">Created {new Date(c.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={e => { e.stopPropagation(); setViewingCampaignId(isViewing ? null : c.id); }}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${isViewing ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}
                                                    >
                                                        <Eye className="h-3 w-3" /> {isViewing ? 'Hide Sequence' : 'View Sequence'}
                                                    </button>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); toggleCampaignStatus(c.id, c.status); }}
                                                        className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${c.status === 'active'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20'
                                                            : 'bg-white/5 text-slate-400 border-white/10 hover:bg-emerald-500/10 hover:text-emerald-400'}`}
                                                    >
                                                        {c.status === 'active' ? 'Active' : c.status === 'draft' ? 'Draft' : 'Paused'}
                                                    </button>
                                                    <button onClick={e => { e.stopPropagation(); deleteCampaign(c.id); }} className="p-1.5 text-slate-500 hover:text-red-400 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Stats */}
                                            <div className="grid grid-cols-3 gap-3 mb-4">
                                                <div className="bg-white/3 rounded-xl p-3 text-center">
                                                    <div className="text-xl font-black text-white">{leadsInCampaign.length}</div>
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Leads</div>
                                                </div>
                                                <div className="bg-white/3 rounded-xl p-3 text-center">
                                                    <div className="text-xl font-black text-emerald-400">{connected}</div>
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Connected</div>
                                                </div>
                                                <div className="bg-white/3 rounded-xl p-3 text-center">
                                                    <div className="text-xl font-black text-sky-400">{replied}</div>
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Replied</div>
                                                </div>
                                            </div>

                                            {/* Sequence preview bar */}
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                                                <UserPlus className="h-3 w-3 text-amber-400" /> Connect
                                                <ArrowRight className="h-2.5 w-2.5" />
                                                <Clock className="h-3 w-3" /> {c.followup_1_delay_days}d
                                                <ArrowRight className="h-2.5 w-2.5" />
                                                <MessageCircle className="h-3 w-3 text-violet-400" /> Msg 1
                                                <ArrowRight className="h-2.5 w-2.5" />
                                                <Clock className="h-3 w-3" /> {c.followup_2_delay_days}d
                                                <ArrowRight className="h-2.5 w-2.5" />
                                                <Send className="h-3 w-3 text-sky-400" /> Msg 2
                                            </div>

                                            {isSelected && (
                                                <div className="mt-3 pt-3 border-t border-indigo-500/20 text-xs text-indigo-400 font-bold text-center">
                                                    ✓ Selected — assign leads from Pipeline view
                                                </div>
                                            )}
                                        </div>

                                        {/* ═══ Expanded Sequence Detail Drawer ═══ */}
                                        <AnimatePresence>
                                            {isViewing && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="px-6 pb-6 pt-2 border-t border-white/5 space-y-5">

                                                        {/* Step 1: Connection Request */}
                                                        <div className="p-5 bg-white/3 border border-amber-500/10 rounded-xl">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                                    <UserPlus className="h-4 w-4 text-amber-400" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-white">Step 1: Connection Request</div>
                                                                    <div className="text-[10px] text-slate-500">Sent immediately when you reach out</div>
                                                                </div>
                                                                <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                                                                    {c.connection_message?.length || 0} chars
                                                                </span>
                                                            </div>
                                                            <div className="bg-black/30 border border-white/5 rounded-lg p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
                                                                {c.connection_message || '(no message set)'}
                                                            </div>
                                                        </div>

                                                        {/* Delay indicator */}
                                                        <div className="flex items-center gap-3 px-6">
                                                            <div className="flex-1 h-px bg-white/10" />
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                                <Clock className="h-3 w-3 text-amber-400" />
                                                                Wait {c.followup_1_delay_days} days after they accept
                                                            </div>
                                                            <div className="flex-1 h-px bg-white/10" />
                                                        </div>

                                                        {/* Step 2: Follow-up #1 */}
                                                        <div className="p-5 bg-white/3 border border-violet-500/10 rounded-xl">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-8 h-8 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                                                    <MessageCircle className="h-4 w-4 text-violet-400" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-white">Step 2: First Message ({c.followup_1_delay_days}-day follow-up)</div>
                                                                    <div className="text-[10px] text-slate-500">Sent after connection is accepted</div>
                                                                </div>
                                                            </div>
                                                            <div className="bg-black/30 border border-white/5 rounded-lg p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
                                                                {c.followup_1 || '(no message set)'}
                                                            </div>
                                                        </div>

                                                        {/* Delay indicator */}
                                                        <div className="flex items-center gap-3 px-6">
                                                            <div className="flex-1 h-px bg-white/10" />
                                                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                                <Clock className="h-3 w-3 text-violet-400" />
                                                                Wait {c.followup_2_delay_days} days if no reply
                                                            </div>
                                                            <div className="flex-1 h-px bg-white/10" />
                                                        </div>

                                                        {/* Step 3: Follow-up #2 */}
                                                        <div className="p-5 bg-white/3 border border-sky-500/10 rounded-xl">
                                                            <div className="flex items-center gap-3 mb-3">
                                                                <div className="w-8 h-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                                                                    <Send className="h-4 w-4 text-sky-400" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-white">Step 3: Final Follow-up ({c.followup_2_delay_days}-day nudge)</div>
                                                                    <div className="text-[10px] text-slate-500">Last message if no response</div>
                                                                </div>
                                                            </div>
                                                            <div className="bg-black/30 border border-white/5 rounded-lg p-4 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-mono">
                                                                {c.followup_2 || '(no message set)'}
                                                            </div>
                                                        </div>

                                                        {/* ═══ LinkedIn Send Controls ═══ */}
                                                        <div className="p-5 bg-indigo-500/5 border border-indigo-500/15 rounded-xl space-y-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                                                                    <Send className="h-4 w-4 text-indigo-400" />
                                                                </div>
                                                                <div>
                                                                    <div className="text-sm font-bold text-white">Send Connection Requests</div>
                                                                    <div className="text-[10px] text-slate-500">Sends personalized invites via LinkedIn. Requires your li_at session cookie.</div>
                                                                </div>
                                                            </div>

                                                            {/* Cookie input */}
                                                            {!liCookieSaved ? (
                                                                <div className="flex gap-3 items-end">
                                                                    <div className="flex-1">
                                                                        <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase tracking-widest">LinkedIn li_at Cookie</label>
                                                                        <input type="password" value={liCookie} onChange={e => setLiCookie(e.target.value)}
                                                                            placeholder="Paste your li_at cookie value..."
                                                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500/50" />
                                                                        <div className="text-[9px] text-slate-600 mt-1 leading-relaxed">
                                                                            Open LinkedIn in Chrome → F12 → Application tab → Cookies → linkedin.com → copy the value of "li_at"
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={saveLiCookie} disabled={!liCookie.trim()}
                                                                        className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-slate-300 hover:text-white transition-all disabled:opacity-50 flex items-center gap-2">
                                                                        <Save className="h-4 w-4" /> Save
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-xl">
                                                                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
                                                                        <CheckCircle2 className="h-3.5 w-3.5" /> LinkedIn session cookie saved
                                                                    </div>
                                                                    <button onClick={() => { setLiCookieSaved(false); setLiCookie(''); }} className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors">Change</button>
                                                                </div>
                                                            )}

                                                            {/* Send button + progress */}
                                                            {liCookieSaved && (
                                                                <>
                                                                    {sendingCampaignId === c.id ? (
                                                                        <div className="space-y-3">
                                                                            <div className="flex items-center gap-3">
                                                                                <Loader2 className="h-4 w-4 text-indigo-400 animate-spin" />
                                                                                <span className="text-sm font-bold text-white">
                                                                                    Sending {sendProgress.sent}/{sendProgress.total}...
                                                                                </span>
                                                                                <span className="text-[10px] text-slate-500">8-15s delay between each to avoid detection</span>
                                                                            </div>
                                                                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                                                                <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${sendProgress.total > 0 ? (sendProgress.sent / sendProgress.total) * 100 : 0}%` }} />
                                                                            </div>
                                                                            {sendProgress.errors.length > 0 && (
                                                                                <div className="text-[10px] text-rose-400 space-y-0.5">
                                                                                    {sendProgress.errors.map((e, i) => <div key={i}>{e}</div>)}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : sendComplete ? (
                                                                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400 font-medium">
                                                                            Sent {sendProgress.sent} of {sendProgress.total} connection requests.
                                                                            {sendProgress.errors.length > 0 && ` ${sendProgress.errors.length} failed.`}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-4">
                                                                            <button onClick={() => sendLinkedInConnections(c.id)}
                                                                                disabled={leadsInCampaign.filter(l => l.linkedin_url && l.stage === 'scraped').length === 0}
                                                                                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20">
                                                                                <UserPlus className="h-4 w-4" />
                                                                                Send {leadsInCampaign.filter(l => l.linkedin_url && l.stage === 'scraped').length} Connection Requests
                                                                            </button>
                                                                            <div className="text-[10px] text-slate-500 leading-relaxed max-w-xs">
                                                                                Only sends to leads with LinkedIn URLs still at "Scraped" stage. Max 25/day recommended.
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>

                                                        {/* Leads assigned to this campaign */}
                                                        {leadsInCampaign.length > 0 && (
                                                            <div className="mt-2 pt-4 border-t border-white/5">
                                                                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                                                                    Leads in This Campaign ({leadsInCampaign.length})
                                                                </div>
                                                                <div className="space-y-2">
                                                                    {leadsInCampaign.map(lead => {
                                                                        const stageCfg = STAGE_CONFIG[lead.stage];
                                                                        return (
                                                                            <div key={lead.id} className="flex items-center gap-3 p-3 bg-white/3 border border-white/5 rounded-xl">
                                                                                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs font-black shrink-0">
                                                                                    {lead.first_name?.charAt(0) || 'L'}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="text-sm font-bold text-slate-200 truncate">{lead.first_name} {lead.last_name}</div>
                                                                                    <div className="text-[10px] text-slate-500">{lead.company || '—'}</div>
                                                                                </div>
                                                                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${stageCfg.bg} ${stageCfg.border} ${stageCfg.color} uppercase tracking-widest`}>
                                                                                    {stageCfg.label}
                                                                                </span>
                                                                                {lead.linkedin_url && (
                                                                                    <a href={lead.linkedin_url} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all shrink-0">
                                                                                        <ExternalLink className="h-3 w-3" />
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

export default LinkedInOutreach;

