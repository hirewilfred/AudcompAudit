import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
    Sparkles, Loader2, RefreshCw, CheckCircle2, Clock, Play,
    Target, Zap, Database, MessageCircle, Send, Activity, Filter,
    ChevronDown, ChevronRight, AlertCircle, Users, Bot,
    Cloud, X, CalendarClock, Trash2, Plus, Bell, Power, Mail,
    FileText, Briefcase, ClipboardCheck, Lock,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { runCloudMission, type ExecutorEvent } from '../lib/cloudMission';

// ─── Types ───
type AgentRunStatus = 'queued' | 'running' | 'succeeded' | 'failed';
type ViewId = 'mission' | 'feed' | 'team' | 'automations';

interface SavedMission {
    id: string;
    name: string;
    goal: string;
    frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
    hour_utc: number;
    day_of_week: number | null;
    day_of_month: number | null;
    enabled: boolean;
    last_run_at: string | null;
    next_run_at: string | null;
    last_run_status: string | null;
}
interface TelegramConfig { chat_id: string; enabled: boolean; created_at: string; }
interface GoogleConfig { email_address: string; connected_at: string; last_send_at: string | null; }

interface AgentRun {
    id: string;
    mission_id: string | null;
    parent_run_id: string | null;
    agent_name: string;
    status: AgentRunStatus;
    goal: string;
    task: string;
    input: any;
    output: any;
    affected_table: string | null;
    affected_count: number;
    error: string | null;
    started_at: string;
    completed_at: string | null;
    created_at: string;
}

// ─── Agent registry ───
interface AgentDef {
    name: string;
    label: string;
    description: string;
    icon: any;
    color: string;
    bg: string;
    border: string;
    status: 'live' | 'planned';
}
interface AgentGroup {
    id: string;
    label: string;
    description: string;
    icon: any;
    accent: string;
    accentBg: string;
    accentBorder: string;
    status: 'live' | 'planned';
    agents: AgentDef[];
}

const AGENT_GROUPS: AgentGroup[] = [
    {
        id: 'outreach',
        label: 'Outreach',
        description: 'Cold acquisition: scrape leads, enrich them, draft personalized messages, queue campaigns.',
        icon: Send,
        accent: 'text-violet-400',
        accentBg: 'bg-violet-500/10',
        accentBorder: 'border-violet-500/20',
        status: 'live',
        agents: [
            { name: 'marketing-orchestrator', label: 'Orchestrator', description: 'Plans the mission and delegates to the right specialist.', icon: Sparkles, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', status: 'live' },
            { name: 'lead-hunter', label: 'Lead Hunter', description: 'Scrapes prospects via Apify (Google Places, LinkedIn, Apollo).', icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', status: 'live' },
            { name: 'lead-enricher', label: 'Lead Enricher', description: 'Fills in missing emails, LinkedIn URLs, and company info.', icon: Database, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', status: 'live' },
            { name: 'outreach-strategist', label: 'Outreach Strategist', description: 'Drafts personalized email + LinkedIn copy in your voice.', icon: MessageCircle, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', status: 'live' },
            { name: 'campaign-manager', label: 'Campaign Manager', description: 'Creates campaigns and queues leads. Never auto-sends.', icon: Send, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', status: 'live' },
        ],
    },
    {
        id: 'marketing',
        label: 'Marketing',
        description: 'Top-of-funnel content: blog scheduling, SEO, social repurposing, newsletters.',
        icon: FileText,
        accent: 'text-pink-400',
        accentBg: 'bg-pink-500/10',
        accentBorder: 'border-pink-500/20',
        status: 'planned',
        agents: [
            { name: 'content-scheduler', label: 'Content Scheduler', description: 'Proposes the next blog topic from the queue and generates the cover image.', icon: FileText, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', status: 'planned' },
            { name: 'seo-auditor', label: 'SEO Auditor', description: 'Audits keyword gaps, internal links, and meta tags on existing posts.', icon: ClipboardCheck, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', status: 'planned' },
            { name: 'social-repurposer', label: 'Social Repurposer', description: 'Turns blog posts into LinkedIn and X threads.', icon: MessageCircle, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', status: 'planned' },
            { name: 'newsletter-composer', label: 'Newsletter Composer', description: 'Compiles a weekly digest from new posts and CRM activity.', icon: Mail, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20', status: 'planned' },
        ],
    },
    {
        id: 'quote-followup',
        label: 'Quote Follow-up',
        description: 'Watches sent quotes and nudges prospects until they reply or close.',
        icon: Briefcase,
        accent: 'text-emerald-400',
        accentBg: 'bg-emerald-500/10',
        accentBorder: 'border-emerald-500/20',
        status: 'planned',
        agents: [
            { name: 'quote-tracker', label: 'Quote Tracker', description: 'Watches deals in proposal/quoted stage and schedules touches at +2d / +5d / +10d.', icon: Clock, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', status: 'planned' },
            { name: 'followup-drafter', label: 'Follow-up Drafter', description: 'Writes the nudge email referencing the specific quote line items.', icon: Mail, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', status: 'planned' },
            { name: 'objection-handler', label: 'Objection Handler', description: 'Drafts replies addressing price, scope, or timing concerns when prospects respond.', icon: MessageCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', status: 'planned' },
        ],
    },
    {
        id: 'audit',
        label: 'Audit Pipeline',
        description: 'Processes audit submissions, generates reports, and converts them into discovery calls.',
        icon: ClipboardCheck,
        accent: 'text-sky-400',
        accentBg: 'bg-sky-500/10',
        accentBorder: 'border-sky-500/20',
        status: 'planned',
        agents: [
            { name: 'audit-intake', label: 'Audit Intake', description: 'Processes new submissions, scores them, and assigns an expert.', icon: ClipboardCheck, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', status: 'planned' },
            { name: 'audit-report', label: 'Report Generator', description: 'Drafts the personalized audit report.', icon: FileText, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', status: 'planned' },
            { name: 'audit-followup', label: 'Audit Follow-up', description: 'Converts audit completers into discovery calls.', icon: Send, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', status: 'planned' },
        ],
    },
];

const ALL_AGENTS: AgentDef[] = AGENT_GROUPS.flatMap(g => g.agents);
const findAgent = (name: string) => ALL_AGENTS.find(a => a.name === name);

const STATUS_STYLES: Record<AgentRunStatus, { color: string; bg: string; border: string; label: string }> = {
    queued: { color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', label: 'Queued' },
    running: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', label: 'Running' },
    succeeded: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'Succeeded' },
    failed: { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Failed' },
};

// ─── Mission templates (Outreach group, the one that's wired up) ───
const MISSION_TEMPLATES: { label: string; goal: string; icon: any; channel?: 'email' | 'linkedin' | 'both' }[] = [
    { label: 'Email Campaign', icon: Mail, channel: 'email', goal: 'Find 10 [persona] in [city, state] via Apollo and draft personalized email outreach for them.' },
    { label: 'LinkedIn Campaign', icon: Send, channel: 'linkedin', goal: 'Find 25 [persona] in [city, state], draft personalized LinkedIn outreach, and queue them in a new campaign called "[campaign name]". Do not auto-activate.' },
    { label: 'Find New Leads', icon: Target, goal: 'Find 25 [persona] in [city, state] using Google Places. Save them to the CRM.' },
    { label: 'Enrich Existing CRM', icon: Database, goal: 'Enrich all CRM contacts from the google-places source that are missing emails. Cap at 50.' },
    { label: 'Draft Outreach Only', icon: MessageCircle, goal: 'Draft personalized outreach for the 10 most recently added leads. Lead with the AI Receptionist service.' },
    { label: 'Full Pipeline', icon: Zap, channel: 'both', goal: 'Find 30 [persona] in [city], enrich them, draft personalized outreach (email + LinkedIn), and queue LinkedIn leads in a new campaign called "[campaign name]". Do not auto-activate.' },
];

// ─── Helpers ───
const formatRelative = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s ago`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h ago`;
    const days = Math.floor(hr / 24);
    return `${days}d ago`;
};
const formatDuration = (start: string, end: string | null) => {
    if (!end) return '—';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

// ─── Main Component ───
const MarketingOS: React.FC = () => {
    const { user } = useAuth();
    const [activeView, setActiveView] = useState<ViewId>('mission');
    const [runs, setRuns] = useState<AgentRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [tableMissing, setTableMissing] = useState(false);

    // Mission launcher (Outreach)
    const [missionGoal, setMissionGoal] = useState('');
    const [missionChannel, setMissionChannel] = useState<'email' | 'linkedin' | 'both'>('both');
    const [copyToast, setCopyToast] = useState<string | null>(null);

    // Cloud execution state
    const [cloudRunning, setCloudRunning] = useState(false);
    const [cloudEvents, setCloudEvents] = useState<ExecutorEvent[]>([]);
    const [cloudError, setCloudError] = useState<string | null>(null);

    // Automations state
    const [savedMissions, setSavedMissions] = useState<SavedMission[]>([]);
    const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [saveDraft, setSaveDraft] = useState<{ name: string; frequency: 'manual' | 'daily' | 'weekly' | 'monthly'; hour_utc: number; day_of_week: number; day_of_month: number }>({ name: '', frequency: 'daily', hour_utc: 13, day_of_week: 1, day_of_month: 1 });
    const [tgDraft, setTgDraft] = useState({ botToken: '', chatId: '' });
    const [tgBusy, setTgBusy] = useState(false);
    const [tgError, setTgError] = useState<string | null>(null);
    const [googleConfig, setGoogleConfig] = useState<GoogleConfig | null>(null);
    const [googleBusy, setGoogleBusy] = useState(false);

    // Outbox state
    const [outbox, setOutbox] = useState({ emails: 0, linkedinConnections: 0, emailIds: [] as string[], linkedinIds: [] as string[] });
    const [outboxBusy, setOutboxBusy] = useState<'email' | 'linkedin' | 'test' | 'schedule-email' | 'schedule-linkedin' | null>(null);
    const [outboxResult, setOutboxResult] = useState<string | null>(null);
    const [scheduleDialog, setScheduleDialog] = useState<'email' | 'linkedin' | null>(null);
    const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
    const [testDialog, setTestDialog] = useState(false);
    const [testEmail, setTestEmail] = useState('');

    // Activity feed filters
    const [agentFilter, setAgentFilter] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

    // Team view: which group is expanded
    const [openGroupId, setOpenGroupId] = useState<string | null>('outreach');

    const [kpis, setKpis] = useState({ leadsLast7d: 0, contactsTotal: 0, campaignsLive: 0, repliesTotal: 0 });

    const authedFetch = useCallback(async (path: string, init?: RequestInit) => {
        if (!supabase) throw new Error('Supabase not configured');
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error('Not signed in');
        return fetch(path, {
            ...init,
            headers: { ...(init?.headers || {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
    }, []);

    // ─── Fetchers ───
    const fetchRuns = useCallback(async () => {
        if (!supabase || !user) return;
        const { data, error } = await supabase
            .from('marketing_agent_runs')
            .select('*')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);
        if (error) {
            if (error.code === 'PGRST205' || error.message?.includes('schema cache')) setTableMissing(true);
            setLoading(false);
            return;
        }
        setRuns((data || []) as AgentRun[]);
        setTableMissing(false);
        setLoading(false);
    }, [user]);

    const fetchKpis = useCallback(async () => {
        if (!supabase || !user) return;
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const [leadsRes, contactsRes, campaignsRes, repliesRes] = await Promise.all([
            supabase.from('linkedin_leads').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).gte('created_at', sevenDaysAgo),
            supabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
            supabase.from('linkedin_campaigns').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).eq('status', 'active'),
            supabase.from('linkedin_leads').select('id', { count: 'exact', head: true }).eq('owner_id', user.id).in('stage', ['replied', 'converted']),
        ]);
        setKpis({
            leadsLast7d: leadsRes.count || 0,
            contactsTotal: contactsRes.count || 0,
            campaignsLive: campaignsRes.count || 0,
            repliesTotal: repliesRes.count || 0,
        });
    }, [user]);

    const fetchMissions = useCallback(async () => {
        try { const res = await authedFetch('/api/missions'); if (!res.ok) return; const j = await res.json(); setSavedMissions(j.missions || []); } catch {}
    }, [authedFetch]);
    const fetchTelegram = useCallback(async () => {
        try { const res = await authedFetch('/api/telegram/setup'); if (!res.ok) return; const j = await res.json(); setTelegramConfig(j.config || null); } catch {}
    }, [authedFetch]);
    const fetchGoogle = useCallback(async () => {
        try { const res = await authedFetch('/api/google'); if (!res.ok) return; const j = await res.json(); setGoogleConfig(j.config || null); } catch {}
    }, [authedFetch]);

    const fetchOutbox = useCallback(async () => {
        if (!supabase || !user) return;
        const { data } = await supabase
            .from('crm_activities')
            .select('id, type, subject, due_date')
            .eq('owner_id', user.id)
            .eq('completed', false)
            .in('type', ['email', 'linkedin']);
        const rows = (data || []) as Array<{ id: string; type: string; subject: string; due_date: string | null }>;
        const nowMs = Date.now();
        const isReady = (r: { due_date: string | null }) => !r.due_date || new Date(r.due_date).getTime() <= nowMs;
        const emailIds = rows.filter(r => r.type === 'email' && isReady(r)).map(r => r.id);
        const linkedinIds = rows.filter(r => r.type === 'linkedin' && /connection request/i.test(r.subject || '') && isReady(r)).map(r => r.id);
        setOutbox({ emails: emailIds.length, linkedinConnections: linkedinIds.length, emailIds, linkedinIds });
    }, [user]);

    const sendAllOutbox = async (channel: 'email' | 'linkedin') => {
        const ids = channel === 'email' ? outbox.emailIds : outbox.linkedinIds;
        if (ids.length === 0) return;
        setOutboxBusy(channel); setOutboxResult(null);
        try {
            const path = channel === 'email' ? '/api/agents/email-sender' : '/api/agents/linkedin-sender';
            const res = await authedFetch(path, { method: 'POST', body: JSON.stringify({ activityIds: ids }) });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || 'Send failed');
            setOutboxResult(`Sent ${j.sentCount} of ${ids.length} ${channel === 'email' ? 'emails' : 'LinkedIn requests'}.`);
            fetchOutbox(); fetchRuns();
        } catch (e: any) { setOutboxResult(`Error: ${e.message}`); } finally { setOutboxBusy(null); }
    };

    const scheduleOutbox = async (channel: 'email' | 'linkedin') => {
        const ids = channel === 'email' ? outbox.emailIds : outbox.linkedinIds;
        if (ids.length === 0 || !scheduleDateTime || !supabase) return;
        const dueIso = new Date(scheduleDateTime).toISOString();
        if (new Date(dueIso).getTime() < Date.now()) { setOutboxResult('Scheduled time must be in the future.'); return; }
        setOutboxBusy(`schedule-${channel}` as any); setOutboxResult(null);
        try {
            const { error } = await supabase.from('crm_activities').update({ due_date: dueIso }).in('id', ids);
            if (error) throw error;
            setOutboxResult(`Scheduled ${ids.length} ${channel === 'email' ? 'emails' : 'LinkedIn requests'} to send at ${new Date(dueIso).toLocaleString()}.`);
            setScheduleDialog(null); setScheduleDateTime(''); fetchOutbox();
        } catch (e: any) { setOutboxResult(`Schedule failed: ${e.message}`); } finally { setOutboxBusy(null); }
    };

    const sendTestEmail = async () => {
        if (outbox.emailIds.length === 0) return;
        if (!testEmail.trim() || !testEmail.includes('@')) { setOutboxResult('Enter a valid test email address.'); return; }
        setOutboxBusy('test'); setOutboxResult(null);
        try {
            const res = await authedFetch('/api/agents/email-sender', {
                method: 'POST',
                body: JSON.stringify({ activityIds: [outbox.emailIds[0]], testTo: testEmail.trim() }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || 'Test send failed');
            const r0 = j.results?.[0];
            if (r0?.error) throw new Error(r0.error);
            setOutboxResult(`Test email sent to ${testEmail}. Check your inbox to verify formatting.`);
            setTestDialog(false);
        } catch (e: any) { setOutboxResult(`Test failed: ${e.message}`); } finally { setOutboxBusy(null); }
    };

    useEffect(() => {
        fetchRuns(); fetchKpis(); fetchMissions(); fetchTelegram(); fetchGoogle(); fetchOutbox();
        const params = new URLSearchParams(window.location.search);
        if (params.get('googleConnected') === '1') {
            setCopyToast('Gmail connected'); setTimeout(() => setCopyToast(null), 3000);
            window.history.replaceState({}, '', window.location.pathname);
        }
        if (params.get('googleError')) {
            setCopyToast(`Google error: ${params.get('googleError')}`); setTimeout(() => setCopyToast(null), 5000);
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, [fetchRuns, fetchKpis, fetchMissions, fetchTelegram, fetchGoogle, fetchOutbox]);

    useEffect(() => {
        if (!supabase || !user || tableMissing) return;
        const interval = setInterval(() => { fetchRuns(); fetchKpis(); fetchOutbox(); }, 5000);
        return () => clearInterval(interval);
    }, [fetchRuns, fetchKpis, fetchOutbox, user, tableMissing]);

    // ─── Derived ───
    const activeRuns = runs.filter(r => r.status === 'running' || r.status === 'queued');
    const filteredFeed = useMemo(() =>
        runs.filter(r => (agentFilter === 'all' || r.agent_name === agentFilter) && (statusFilter === 'all' || r.status === statusFilter)),
        [runs, agentFilter, statusFilter]);
    const agentLastRun = (name: string) => runs.find(r => r.agent_name === name) || null;
    const agentSuccessRate = (name: string) => {
        const agentRuns = runs.filter(r => r.agent_name === name && r.status !== 'running' && r.status !== 'queued');
        if (agentRuns.length === 0) return null;
        return Math.round((agentRuns.filter(r => r.status === 'succeeded').length / agentRuns.length) * 100);
    };

    // ─── Actions ───
    const showToast = (msg: string) => { setCopyToast(msg); setTimeout(() => setCopyToast(null), 2500); };

    const buildGoalWithChannel = (goal: string): string => {
        const trimmed = goal.trim();
        if (missionChannel === 'email') return `[Channel: email-only — use Apollo for sourcing if scraping, skip the LinkedIn campaign-manager step] ${trimmed}`;
        if (missionChannel === 'linkedin') return `[Channel: LinkedIn-only — skip email drafting if possible, always include the campaign-manager step] ${trimmed}`;
        return trimmed;
    };

    const launchCloudMission = async () => {
        if (!missionGoal.trim() || cloudRunning) return;
        setCloudRunning(true); setCloudError(null); setCloudEvents([]);
        try {
            await runCloudMission(buildGoalWithChannel(missionGoal), (e) => {
                setCloudEvents(prev => [...prev, e]); fetchRuns();
            });
        } catch (err: any) { setCloudError(err.message || String(err)); }
        finally { setCloudRunning(false); fetchRuns(); fetchKpis(); }
    };

    const dismissCloudPanel = () => {
        if (cloudRunning) return;
        setCloudEvents([]); setCloudError(null);
    };

    const useTemplate = (goal: string, channel?: 'email' | 'linkedin' | 'both') => {
        setMissionGoal(goal);
        if (channel) setMissionChannel(channel);
    };

    const saveMission = async () => {
        if (!missionGoal.trim() || !saveDraft.name.trim()) return;
        const payload: any = {
            name: saveDraft.name.trim(), goal: missionGoal,
            frequency: saveDraft.frequency, hour_utc: saveDraft.hour_utc, enabled: true,
        };
        if (saveDraft.frequency === 'weekly') payload.day_of_week = saveDraft.day_of_week;
        if (saveDraft.frequency === 'monthly') payload.day_of_month = saveDraft.day_of_month;
        const res = await authedFetch('/api/missions', { method: 'POST', body: JSON.stringify(payload) });
        if (res.ok) {
            setShowSaveDialog(false); setSaveDraft({ ...saveDraft, name: '' });
            showToast('Mission saved'); fetchMissions();
        }
    };
    const deleteMission = async (id: string) => { await authedFetch(`/api/missions?id=${id}`, { method: 'DELETE' }); fetchMissions(); };
    const toggleMission = async (m: SavedMission) => {
        await authedFetch('/api/missions', {
            method: 'PUT',
            body: JSON.stringify({ id: m.id, name: m.name, goal: m.goal, frequency: m.frequency, hour_utc: m.hour_utc, day_of_week: m.day_of_week, day_of_month: m.day_of_month, enabled: !m.enabled }),
        });
        fetchMissions();
    };
    const runMissionNow = async (m: SavedMission) => {
        await authedFetch('/api/missions', {
            method: 'PUT',
            body: JSON.stringify({ id: m.id, name: m.name, goal: m.goal, frequency: m.frequency, hour_utc: m.hour_utc, day_of_week: m.day_of_week, day_of_month: m.day_of_month, enabled: true }),
        });
        setMissionGoal(m.goal); setActiveView('mission');
        setTimeout(() => launchCloudMission(), 50);
    };

    const connectTelegram = async () => {
        if (!tgDraft.botToken.trim() || !tgDraft.chatId.trim()) return;
        setTgBusy(true); setTgError(null);
        try {
            const res = await authedFetch('/api/telegram/setup', {
                method: 'POST', body: JSON.stringify({ botToken: tgDraft.botToken.trim(), chatId: tgDraft.chatId.trim() }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || 'Setup failed');
            setTgDraft({ botToken: '', chatId: '' }); fetchTelegram();
        } catch (e: any) { setTgError(e.message); } finally { setTgBusy(false); }
    };
    const disconnectTelegram = async () => { await authedFetch('/api/telegram/setup', { method: 'DELETE' }); fetchTelegram(); };

    const connectGoogle = async () => {
        setGoogleBusy(true);
        try {
            const res = await authedFetch('/api/google', { method: 'POST' });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || 'Failed to start OAuth');
            window.location.href = j.url;
        } catch (e: any) { showToast(`Google error: ${e.message}`); } finally { setGoogleBusy(false); }
    };
    const disconnectGoogle = async () => { await authedFetch('/api/google', { method: 'DELETE' }); fetchGoogle(); };

    // ─── Render ───
    const views: { id: ViewId; label: string; icon: any }[] = [
        { id: 'mission', label: 'Mission Control', icon: Sparkles },
        { id: 'team', label: 'Agents', icon: Bot },
        { id: 'feed', label: 'Activity Feed', icon: Activity },
        { id: 'automations', label: 'Automations', icon: CalendarClock },
    ];

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 text-violet-500 animate-spin" /></div>;

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-6">

            {tableMissing && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5 flex items-start gap-4">
                    <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
                    <div className="flex-1">
                        <div className="text-sm font-bold text-amber-300">Migration not yet applied</div>
                        <div className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                            The <code className="text-amber-100 bg-amber-500/10 px-1.5 py-0.5 rounded">marketing_agent_runs</code> table doesn't exist yet.
                            Run <code className="text-amber-100 bg-amber-500/10 px-1.5 py-0.5 rounded">supabase/migrations/20260407_marketing_agent_runs.sql</code> in your Supabase SQL Editor to enable the activity feed.
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
                    {views.map(v => {
                        const Icon = v.icon;
                        return (
                            <button key={v.id} onClick={() => setActiveView(v.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeView === v.id ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/20' : 'text-slate-400 hover:text-white'}`}>
                                <Icon className="h-4 w-4" /> {v.label}
                            </button>
                        );
                    })}
                </div>
                <button onClick={() => { fetchRuns(); fetchKpis(); }} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* ═══════════ MISSION CONTROL ═══════════ */}
            {activeView === 'mission' && (
                <>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'New Leads (7d)', value: kpis.leadsLast7d, icon: Target, color: 'blue' },
                            { label: 'Contacts in CRM', value: kpis.contactsTotal, icon: Users, color: 'cyan' },
                            { label: 'Live Campaigns', value: kpis.campaignsLive, icon: Send, color: 'emerald' },
                            { label: 'Replies', value: kpis.repliesTotal, icon: MessageCircle, color: 'amber' },
                        ].map((kpi) => {
                            const Icon = kpi.icon;
                            return (
                                <div key={kpi.label} className="backdrop-blur-xl bg-slate-900/40 rounded-2xl p-5 border border-white/5">
                                    <div className={`w-10 h-10 rounded-xl bg-${kpi.color}-500/10 border border-${kpi.color}-500/20 flex items-center justify-center mb-3`}>
                                        <Icon className={`h-5 w-5 text-${kpi.color}-400`} />
                                    </div>
                                    <div className="text-3xl font-black text-white mb-1">{kpi.value}</div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-widest">{kpi.label}</div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Outreach mission launcher (only live group) */}
                    <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-violet-500/20 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                <Send className="h-4 w-4 text-violet-400" />
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-white flex items-center gap-2">
                                    Outreach Mission
                                    <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">Live</span>
                                </div>
                                <div className="text-xs text-slate-400">Find leads, enrich, draft personalized outreach, queue campaigns. Runs in the cloud.</div>
                            </div>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Quick Templates</div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {MISSION_TEMPLATES.map(t => {
                                        const Icon = t.icon;
                                        return (
                                            <button key={t.label} onClick={() => useTemplate(t.goal, t.channel)}
                                                className="text-left p-4 rounded-xl border border-white/5 bg-white/3 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all group">
                                                <Icon className="h-5 w-5 text-violet-400 mb-2" />
                                                <div className="text-sm font-bold text-white">{t.label}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mission Goal</label>
                                <textarea value={missionGoal} onChange={e => setMissionGoal(e.target.value)}
                                    placeholder="e.g. Find 30 HVAC owners in Hamilton, enrich them, draft personalized outreach, and queue them for my Spring HVAC LinkedIn campaign."
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50 resize-none" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Channel</label>
                                <div className="flex gap-2 flex-wrap">
                                    {([
                                        { id: 'email' as const, label: 'Email only', icon: Mail, color: 'rose' },
                                        { id: 'linkedin' as const, label: 'LinkedIn only', icon: Send, color: 'indigo' },
                                        { id: 'both' as const, label: 'Email + LinkedIn', icon: Zap, color: 'violet' },
                                    ]).map(opt => {
                                        const Icon = opt.icon;
                                        const active = missionChannel === opt.id;
                                        return (
                                            <button key={opt.id} onClick={() => setMissionChannel(opt.id)}
                                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${active ? `bg-${opt.color}-600 text-white border-${opt.color}-500 shadow-lg shadow-${opt.color}-600/20` : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'}`}>
                                                <Icon className="h-3.5 w-3.5" /> {opt.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 flex-wrap">
                                <button onClick={() => setShowSaveDialog(true)} disabled={!missionGoal.trim() || cloudRunning}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all disabled:opacity-50">
                                    <CalendarClock className="h-4 w-4" /> Save as Mission
                                </button>
                                <button onClick={launchCloudMission} disabled={!missionGoal.trim() || cloudRunning}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-emerald-600/20">
                                    {cloudRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                                    {cloudRunning ? 'Running…' : 'Launch Mission'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {(cloudEvents.length > 0 || cloudError) && (
                        <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-emerald-500/20 overflow-hidden">
                            <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Cloud className="h-4 w-4 text-emerald-400" />
                                    <span className="text-sm font-bold text-white">Mission Log</span>
                                    {cloudRunning && <Loader2 className="h-3 w-3 text-emerald-400 animate-spin" />}
                                </div>
                                {!cloudRunning && (
                                    <button onClick={dismissCloudPanel} className="text-slate-500 hover:text-white">
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="p-4 max-h-72 overflow-y-auto space-y-1.5 font-mono text-xs">
                                {cloudEvents.map((e, idx) => {
                                    const color =
                                        e.kind === 'mission_done' ? 'text-emerald-300' :
                                        e.kind === 'mission_error' || e.kind === 'step_error' ? 'text-rose-300' :
                                        e.kind === 'step_done' ? 'text-emerald-200' :
                                        e.kind === 'step_start' ? 'text-violet-300' :
                                        'text-slate-300';
                                    return (
                                        <div key={idx} className={color}>
                                            <span className="text-slate-600 mr-2">[{e.kind}]</span>{e.message}
                                        </div>
                                    );
                                })}
                                {cloudError && (
                                    <div className="text-rose-300 mt-2 pt-2 border-t border-rose-500/20">
                                        Error: {cloudError}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Outbox */}
                    {(outbox.emails > 0 || outbox.linkedinConnections > 0) && (
                        <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-amber-500/20 overflow-hidden">
                            <div className="px-6 py-4 border-b border-white/5 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-amber-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Outbox</div>
                                    <div className="text-xs text-slate-400">Drafted messages waiting for your approval to send.</div>
                                </div>
                            </div>
                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-3 bg-white/3 rounded-xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl font-black text-rose-400">{outbox.emails}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white">drafted email{outbox.emails === 1 ? '' : 's'}</div>
                                            <div className="text-[10px] text-slate-500">via {googleConfig?.email_address || 'Gmail (not connected)'}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap">
                                        <button onClick={() => { setTestEmail(googleConfig?.email_address || ''); setTestDialog(true); }} disabled={!googleConfig || outbox.emails === 0}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold disabled:opacity-50">
                                            <Mail className="h-3 w-3" /> Test
                                        </button>
                                        <button onClick={() => { setScheduleDialog('email'); setScheduleDateTime(''); }} disabled={outbox.emails === 0}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold disabled:opacity-50">
                                            <CalendarClock className="h-3 w-3" /> Schedule
                                        </button>
                                        <button onClick={() => sendAllOutbox('email')} disabled={!googleConfig || outboxBusy === 'email' || outbox.emails === 0}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 rounded-lg text-[11px] font-bold disabled:opacity-50 ml-auto">
                                            {outboxBusy === 'email' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                            Send now
                                        </button>
                                    </div>
                                </div>
                                <div className="p-3 bg-white/3 rounded-xl border border-white/5 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="text-2xl font-black text-indigo-400">{outbox.linkedinConnections}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold text-white">LinkedIn connection request{outbox.linkedinConnections === 1 ? '' : 's'}</div>
                                            <div className="text-[10px] text-slate-500">~10s rate limit between sends</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 flex-wrap">
                                        <button onClick={() => { setScheduleDialog('linkedin'); setScheduleDateTime(''); }} disabled={outbox.linkedinConnections === 0}
                                            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-[11px] font-bold disabled:opacity-50">
                                            <CalendarClock className="h-3 w-3" /> Schedule
                                        </button>
                                        <button onClick={() => sendAllOutbox('linkedin')} disabled={outboxBusy === 'linkedin' || outbox.linkedinConnections === 0}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-[11px] font-bold disabled:opacity-50 ml-auto">
                                            {outboxBusy === 'linkedin' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                                            Send now
                                        </button>
                                    </div>
                                </div>
                                {outboxResult && (
                                    <div className={`md:col-span-2 text-xs font-bold p-3 rounded-lg ${outboxResult.startsWith('Error') || outboxResult.includes('failed') ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                                        {outboxResult}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Active runs */}
                    <div>
                        <h2 className="text-base font-black text-white mb-4 flex items-center gap-2">
                            <Play className="h-4 w-4 text-violet-400" /> Active Missions
                            {activeRuns.length > 0 && <span className="text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">{activeRuns.length}</span>}
                        </h2>
                        {activeRuns.length === 0 ? (
                            <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 p-10 text-center">
                                <Bot className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                                <div className="text-sm text-slate-500 font-medium">No active missions. Launch one above to get started.</div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeRuns.map(run => {
                                    const agent = findAgent(run.agent_name);
                                    const Icon = agent?.icon || Bot;
                                    const statusCfg = STATUS_STYLES[run.status];
                                    return (
                                        <div key={run.id} className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-violet-500/20 p-5 flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-xl ${agent?.bg || 'bg-white/5'} border ${agent?.border || 'border-white/10'} flex items-center justify-center`}>
                                                <Icon className={`h-5 w-5 ${agent?.color || 'text-slate-400'}`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-bold text-white">{agent?.label || run.agent_name}</span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color}`}>
                                                        {statusCfg.label}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-slate-400">{run.task || run.goal || '—'}</div>
                                            </div>
                                            <Loader2 className="h-5 w-5 text-violet-400 animate-spin" />
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ═══════════ AGENTS (grouped) ═══════════ */}
            {activeView === 'team' && (
                <div className="space-y-4">
                    {AGENT_GROUPS.map(group => {
                        const GroupIcon = group.icon;
                        const isOpen = openGroupId === group.id;
                        const isLive = group.status === 'live';
                        return (
                            <div key={group.id} className={`backdrop-blur-xl bg-slate-900/40 rounded-2xl border ${group.accentBorder} overflow-hidden`}>
                                <button onClick={() => setOpenGroupId(isOpen ? null : group.id)}
                                    className="w-full px-6 py-5 flex items-center gap-4 text-left hover:bg-white/2 transition-colors">
                                    <div className={`w-12 h-12 rounded-xl ${group.accentBg} border ${group.accentBorder} flex items-center justify-center shrink-0`}>
                                        <GroupIcon className={`h-6 w-6 ${group.accent}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="text-base font-black text-white">{group.label}</span>
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-widest ${isLive ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                                                {isLive ? 'Live' : 'Coming soon'}
                                            </span>
                                            <span className="text-[10px] text-slate-500">{group.agents.length} agent{group.agents.length === 1 ? '' : 's'}</span>
                                        </div>
                                        <div className="text-xs text-slate-400">{group.description}</div>
                                    </div>
                                    {isOpen ? <ChevronDown className="h-5 w-5 text-slate-500 shrink-0" /> : <ChevronRight className="h-5 w-5 text-slate-500 shrink-0" />}
                                </button>
                                <AnimatePresence>
                                    {isOpen && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden">
                                            <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {group.agents.map(agent => {
                                                    const Icon = agent.icon;
                                                    const lastRun = agentLastRun(agent.name);
                                                    const successRate = agentSuccessRate(agent.name);
                                                    const planned = agent.status === 'planned';
                                                    return (
                                                        <div key={agent.name}
                                                            className={`rounded-xl border p-4 ${planned ? 'bg-white/2 border-white/5 opacity-70' : `${agent.bg} ${agent.border}`}`}>
                                                            <div className="flex items-start gap-3 mb-3">
                                                                <div className={`w-10 h-10 rounded-lg ${planned ? 'bg-white/5 border-white/10' : `${agent.bg} ${agent.border}`} border flex items-center justify-center shrink-0`}>
                                                                    {planned ? <Lock className="h-4 w-4 text-slate-500" /> : <Icon className={`h-5 w-5 ${agent.color}`} />}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-sm font-bold text-white">{agent.label}</div>
                                                                    <div className="text-[10px] text-slate-500 font-mono">{agent.name}</div>
                                                                </div>
                                                            </div>
                                                            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">{agent.description}</p>
                                                            {!planned && (
                                                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                                                    <div className="bg-black/20 rounded-lg p-2">
                                                                        <div className="font-black text-slate-500 uppercase tracking-widest mb-0.5">Last Run</div>
                                                                        <div className={`font-bold ${lastRun ? STATUS_STYLES[lastRun.status].color : 'text-slate-600'}`}>
                                                                            {lastRun ? formatRelative(lastRun.created_at) : 'Never'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="bg-black/20 rounded-lg p-2">
                                                                        <div className="font-black text-slate-500 uppercase tracking-widest mb-0.5">Success</div>
                                                                        <div className="font-bold text-white">
                                                                            {successRate !== null ? `${successRate}%` : '—'}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ═══════════ AUTOMATIONS ═══════════ */}
            {activeView === 'automations' && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                    <Mail className="h-4 w-4 text-rose-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Gmail</div>
                                    <div className="text-xs text-slate-400">Send drafted emails from your Google account.</div>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                {googleConfig ? (
                                    <>
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                            <div className="text-xs text-emerald-200 leading-relaxed">
                                                Connected as <strong>{googleConfig.email_address}</strong>.
                                                {googleConfig.last_send_at && (
                                                    <div className="text-[10px] text-emerald-300/70 mt-1">Last send {formatRelative(googleConfig.last_send_at)}</div>
                                                )}
                                            </div>
                                        </div>
                                        <button onClick={disconnectGoogle}
                                            className="w-full px-4 py-2 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold transition-all">
                                            Disconnect Gmail
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="text-xs text-slate-400 leading-relaxed">
                                            Once connected, the agents can send drafted emails through your account. Replies thread to your inbox naturally.
                                        </div>
                                        <button onClick={connectGoogle} disabled={googleBusy}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                                            {googleBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                                            Connect Gmail
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
                                    <Bell className="h-4 w-4 text-sky-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Telegram Bot</div>
                                    <div className="text-xs text-slate-400">Trigger missions from your phone.</div>
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                {telegramConfig ? (
                                    <>
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                                            <div className="text-xs text-emerald-200 leading-relaxed">
                                                Connected to chat <code className="text-emerald-100">{telegramConfig.chat_id}</code>. Send <code>/help</code> to your bot.
                                            </div>
                                        </div>
                                        <button onClick={disconnectTelegram}
                                            className="w-full px-4 py-2 bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/20 text-rose-300 rounded-xl text-xs font-bold transition-all">
                                            Disconnect
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <ol className="text-xs text-slate-400 space-y-1.5 list-decimal list-inside leading-relaxed">
                                            <li>Open <a className="text-sky-400 underline" href="https://t.me/BotFather" target="_blank" rel="noreferrer">@BotFather</a>, send <code>/newbot</code>, copy the token.</li>
                                            <li>Send any message to your new bot. Then open <a className="text-sky-400 underline" href="https://t.me/userinfobot" target="_blank" rel="noreferrer">@userinfobot</a> to grab your chat ID.</li>
                                            <li>Paste both below.</li>
                                        </ol>
                                        <input type="text" placeholder="Bot token (from BotFather)" value={tgDraft.botToken}
                                            onChange={e => setTgDraft({ ...tgDraft, botToken: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500/50" />
                                        <input type="text" placeholder="Your Telegram chat ID" value={tgDraft.chatId}
                                            onChange={e => setTgDraft({ ...tgDraft, chatId: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-sky-500/50" />
                                        {tgError && <div className="text-xs text-rose-300">{tgError}</div>}
                                        <button onClick={connectTelegram} disabled={tgBusy || !tgDraft.botToken || !tgDraft.chatId}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
                                            {tgBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
                                            Connect Telegram
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                    <CalendarClock className="h-4 w-4 text-violet-400" />
                                </div>
                                <div>
                                    <div className="font-bold text-white">Saved Missions</div>
                                    <div className="text-xs text-slate-400">Cron dispatcher fires hourly. Daily missions run at the chosen UTC hour.</div>
                                </div>
                            </div>
                            <button onClick={() => { setActiveView('mission'); setShowSaveDialog(false); }}
                                className="text-xs font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1">
                                <Plus className="h-3 w-3" /> New
                            </button>
                        </div>
                        {savedMissions.length === 0 ? (
                            <div className="p-10 text-center">
                                <CalendarClock className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                                <div className="text-sm text-slate-500 font-medium">No saved missions yet.</div>
                                <div className="text-xs text-slate-600 mt-1">Type a goal in Mission Control and click "Save as Mission".</div>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {savedMissions.map(m => (
                                    <div key={m.id} className="px-6 py-4 hover:bg-white/2 transition-colors">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                                    <span className="text-sm font-bold text-white">{m.name}</span>
                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${m.enabled ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'}`}>
                                                        {m.frequency}{m.enabled ? '' : ' · paused'}
                                                    </span>
                                                    {m.last_run_status && (
                                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${m.last_run_status === 'succeeded' ? 'text-emerald-400' : m.last_run_status === 'failed' ? 'text-rose-400' : 'text-blue-400'}`}>
                                                            {m.last_run_status}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-400 line-clamp-2">{m.goal}</div>
                                                <div className="text-[10px] text-slate-600 mt-1.5 flex items-center gap-3 flex-wrap">
                                                    {m.frequency !== 'manual' && <span>Runs at {m.hour_utc.toString().padStart(2, '0')}:00 UTC{m.frequency === 'weekly' && m.day_of_week !== null ? ` · ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][m.day_of_week]}` : ''}{m.frequency === 'monthly' && m.day_of_month !== null ? ` · day ${m.day_of_month}` : ''}</span>}
                                                    {m.next_run_at && <span>Next: {new Date(m.next_run_at).toLocaleString()}</span>}
                                                    {m.last_run_at && <span>Last: {formatRelative(m.last_run_at)}</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => runMissionNow(m)} title="Run now"
                                                    className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg">
                                                    <Play className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => toggleMission(m)} title={m.enabled ? 'Pause' : 'Enable'}
                                                    className="p-1.5 text-slate-400 hover:bg-white/5 rounded-lg">
                                                    <Power className="h-3.5 w-3.5" />
                                                </button>
                                                <button onClick={() => deleteMission(m.id)} title="Delete"
                                                    className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ═══════════ ACTIVITY FEED ═══════════ */}
            {activeView === 'feed' && (
                <>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                            <Filter className="h-3.5 w-3.5" /> Filter:
                        </div>
                        <select value={agentFilter} onChange={e => setAgentFilter(e.target.value)}
                            className="text-xs font-bold bg-white/5 border border-white/10 text-slate-300 rounded-lg px-3 py-1.5 outline-none">
                            <option value="all" className="bg-[#0d1626]">All Agents</option>
                            {ALL_AGENTS.filter(a => a.status === 'live').map(a => <option key={a.name} value={a.name} className="bg-[#0d1626]">{a.label}</option>)}
                        </select>
                        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                            className="text-xs font-bold bg-white/5 border border-white/10 text-slate-300 rounded-lg px-3 py-1.5 outline-none">
                            <option value="all" className="bg-[#0d1626]">All Statuses</option>
                            <option value="running" className="bg-[#0d1626]">Running</option>
                            <option value="succeeded" className="bg-[#0d1626]">Succeeded</option>
                            <option value="failed" className="bg-[#0d1626]">Failed</option>
                            <option value="queued" className="bg-[#0d1626]">Queued</option>
                        </select>
                        <span className="text-xs text-slate-500 ml-auto">{filteredFeed.length} of {runs.length} runs</span>
                    </div>

                    <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                        {filteredFeed.length === 0 ? (
                            <div className="p-12 text-center">
                                <Activity className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                                <div className="text-sm text-slate-500 font-medium">
                                    {runs.length === 0 ? 'No agent runs yet. Launch a mission from Mission Control to see activity here.' : 'No runs match your filters.'}
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {filteredFeed.map(run => {
                                    const agent = findAgent(run.agent_name);
                                    const Icon = agent?.icon || Bot;
                                    const statusCfg = STATUS_STYLES[run.status];
                                    const isExpanded = expandedRunId === run.id;
                                    return (
                                        <div key={run.id} className="hover:bg-white/2 transition-colors">
                                            <button onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                                                className="w-full px-6 py-4 flex items-start gap-4 text-left">
                                                <div className={`w-10 h-10 rounded-xl ${agent?.bg || 'bg-white/5'} border ${agent?.border || 'border-white/10'} flex items-center justify-center shrink-0`}>
                                                    <Icon className={`h-4 w-4 ${agent?.color || 'text-slate-400'}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                                        <span className="text-sm font-bold text-white">{agent?.label || run.agent_name}</span>
                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.border} ${statusCfg.color} uppercase tracking-widest`}>
                                                            {statusCfg.label}
                                                        </span>
                                                        {run.affected_table && (
                                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                                                {run.affected_count} → {run.affected_table}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-400 truncate">{run.task || run.goal || '—'}</div>
                                                    <div className="text-[10px] text-slate-600 mt-1 flex items-center gap-3">
                                                        <span><Clock className="h-2.5 w-2.5 inline mr-1" />{formatRelative(run.created_at)}</span>
                                                        <span>Duration: {formatDuration(run.started_at, run.completed_at)}</span>
                                                    </div>
                                                </div>
                                                {isExpanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
                                            </button>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                                        className="px-6 pb-4 overflow-hidden">
                                                        <div className="ml-14 space-y-3">
                                                            {run.goal && (
                                                                <div>
                                                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Mission Goal</div>
                                                                    <div className="text-xs text-slate-300 leading-relaxed">{run.goal}</div>
                                                                </div>
                                                            )}
                                                            {run.input && Object.keys(run.input).length > 0 && (
                                                                <div>
                                                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Input</div>
                                                                    <pre className="text-[10px] text-slate-400 bg-black/40 border border-white/5 rounded-lg p-3 overflow-x-auto">{JSON.stringify(run.input, null, 2)}</pre>
                                                                </div>
                                                            )}
                                                            {run.output && Object.keys(run.output).length > 0 && (
                                                                <div>
                                                                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Output</div>
                                                                    <pre className="text-[10px] text-slate-400 bg-black/40 border border-white/5 rounded-lg p-3 overflow-x-auto">{JSON.stringify(run.output, null, 2)}</pre>
                                                                </div>
                                                            )}
                                                            {run.error && (
                                                                <div>
                                                                    <div className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">Error</div>
                                                                    <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">{run.error}</div>
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
                </>
            )}

            {/* Schedule send dialog */}
            <AnimatePresence>
                {scheduleDialog && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setScheduleDialog(null)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0d1626] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-xl ${scheduleDialog === 'email' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-indigo-500/10 border-indigo-500/20'} border flex items-center justify-center`}>
                                        <CalendarClock className={`h-4 w-4 ${scheduleDialog === 'email' ? 'text-rose-400' : 'text-indigo-400'}`} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">Schedule {scheduleDialog === 'email' ? 'email' : 'LinkedIn'} send</div>
                                        <div className="text-xs text-slate-400">{scheduleDialog === 'email' ? outbox.emails : outbox.linkedinConnections} drafted message(s) will go out at this time.</div>
                                    </div>
                                </div>
                                <button onClick={() => setScheduleDialog(null)} className="text-slate-400 hover:text-white">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Send at (your local time)</label>
                                    <input type="datetime-local" value={scheduleDateTime}
                                        onChange={e => setScheduleDateTime(e.target.value)}
                                        min={new Date(Date.now() + 60_000).toISOString().slice(0, 16)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" />
                                    <div className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                                        The hourly cron dispatcher releases scheduled messages on or after this time. Actual send may be delayed up to 60 minutes.
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button onClick={() => setScheduleDialog(null)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                                    <button onClick={() => scheduleOutbox(scheduleDialog!)} disabled={!scheduleDateTime || outboxBusy === `schedule-${scheduleDialog}` as any}
                                        className={`px-5 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-50 ${scheduleDialog === 'email' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                                        {outboxBusy === `schedule-${scheduleDialog}` as any ? 'Scheduling…' : 'Schedule'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Test email dialog */}
            <AnimatePresence>
                {testDialog && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setTestDialog(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0d1626] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                        <Mail className="h-4 w-4 text-rose-400" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white">Send test email</div>
                                        <div className="text-xs text-slate-400">Sends the FIRST drafted email to a test address. Subject is prefixed [TEST]. Doesn't mark anything as sent.</div>
                                    </div>
                                </div>
                                <button onClick={() => setTestDialog(false)} className="text-slate-400 hover:text-white">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Test recipient</label>
                                    <input type="email" value={testEmail}
                                        onChange={e => setTestEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-rose-500/50" />
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button onClick={() => setTestDialog(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                                    <button onClick={sendTestEmail} disabled={!testEmail.trim() || outboxBusy === 'test'}
                                        className="px-5 py-2 bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-bold text-white disabled:opacity-50">
                                        {outboxBusy === 'test' ? 'Sending…' : 'Send test'}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Save-as-Mission dialog */}
            <AnimatePresence>
                {showSaveDialog && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setShowSaveDialog(false)}>
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#0d1626] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                        <CalendarClock className="h-4 w-4 text-violet-400" />
                                    </div>
                                    <div className="font-bold text-white">Save as Recurring Mission</div>
                                </div>
                                <button onClick={() => setShowSaveDialog(false)} className="text-slate-400 hover:text-white">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Mission Name</label>
                                    <input type="text" value={saveDraft.name}
                                        onChange={e => setSaveDraft({ ...saveDraft, name: e.target.value })}
                                        placeholder="e.g. Weekly HVAC Hamilton scrape"
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500/50" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Goal (preview)</label>
                                    <div className="text-xs text-slate-300 bg-black/30 border border-white/5 rounded-lg p-3 max-h-24 overflow-y-auto">{missionGoal}</div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Frequency</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {(['manual', 'daily', 'weekly', 'monthly'] as const).map(f => (
                                            <button key={f} onClick={() => setSaveDraft({ ...saveDraft, frequency: f })}
                                                className={`py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${saveDraft.frequency === f ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                                                {f}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                {saveDraft.frequency !== 'manual' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Hour (UTC)</label>
                                            <input type="number" min={0} max={23} value={saveDraft.hour_utc}
                                                onChange={e => setSaveDraft({ ...saveDraft, hour_utc: Number(e.target.value) })}
                                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" />
                                        </div>
                                        {saveDraft.frequency === 'weekly' && (
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Day of Week</label>
                                                <select value={saveDraft.day_of_week}
                                                    onChange={e => setSaveDraft({ ...saveDraft, day_of_week: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50">
                                                    {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d, i) => <option key={i} value={i} className="bg-[#0d1626]">{d}</option>)}
                                                </select>
                                            </div>
                                        )}
                                        {saveDraft.frequency === 'monthly' && (
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Day of Month</label>
                                                <input type="number" min={1} max={28} value={saveDraft.day_of_month}
                                                    onChange={e => setSaveDraft({ ...saveDraft, day_of_month: Number(e.target.value) })}
                                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-violet-500/50" />
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <button onClick={() => setShowSaveDialog(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancel</button>
                                    <button onClick={saveMission} disabled={!saveDraft.name.trim()}
                                        className="px-5 py-2 bg-violet-600 hover:bg-violet-700 rounded-lg text-xs font-bold text-white disabled:opacity-50">
                                        Save Mission
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {copyToast && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                        className="fixed bottom-8 right-8 bg-violet-600 text-white px-5 py-3 rounded-xl shadow-2xl shadow-violet-600/30 flex items-center gap-2 text-sm font-bold z-50">
                        <CheckCircle2 className="h-4 w-4" /> {copyToast}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default MarketingOS;
