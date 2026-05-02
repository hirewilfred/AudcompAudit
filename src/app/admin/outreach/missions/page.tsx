'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Sparkles, Loader2, CheckCircle2, AlertCircle, ChevronRight,
    Clipboard, Bot, Play, Activity,
} from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';

type Mission = {
    mission_id: string;
    goal: string | null;
    status: 'running' | 'succeeded' | 'failed' | 'queued';
    started_at: string;
    completed_at: string | null;
    agent_count: number;
    agents: string[];
    output: any;
};

type Run = {
    id: string;
    agent_name: string;
    status: string;
    task: string | null;
    input: any;
    output: any;
    affected_table: string | null;
    affected_count: number | null;
    error: string | null;
    started_at: string;
    completed_at: string | null;
};

const TEMPLATES = [
    { label: 'Cold acquisition', text: 'Find 30 [persona] in [city] for [expert]. Enrich emails + LinkedIn URLs. Draft conversational LinkedIn icebreakers leading with the Free AI Audit. Push to a new draft campaign for expert review.' },
    { label: 'Warm reactivation', text: 'Reactivate the unreplied leads in [campaign name]. Draft a fresh follow-up that references their pain point. Push as a new sequence in the same campaign.' },
    { label: 'Enrichment only', text: 'Enrich every lead in [campaign name] missing email or LinkedIn URL. Use Apollo. Cap at 100/min.' },
    { label: 'Content prep', text: 'Draft 4 LinkedIn icebreakers for the next 4 leads in [campaign name] in [expert]\'s voice, leading with [service]. Queue them for approval.' },
];

const fmtRel = (iso: string | null | undefined) => {
    if (!iso) return '—';
    const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (sec < 60) return `${sec}s ago`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
    if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const statusTone = (s: string) =>
    s === 'succeeded' ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : s === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-100'
        : s === 'running' ? 'bg-blue-50 text-blue-700 border-blue-100'
        : 'bg-slate-50 text-slate-500 border-slate-100';

export default function MissionsPage() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [totals, setTotals] = useState({ total: 0, running: 0, succeeded_24h: 0, failed_24h: 0 });
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [runsById, setRunsById] = useState<Record<string, Run[]>>({});
    const [missionGoal, setMissionGoal] = useState('');

    const refresh = async () => {
        const res = await fetch('/api/admin/missions');
        const j = await res.json();
        setMissions(j.missions ?? []);
        setTotals(j.totals ?? { total: 0, running: 0, succeeded_24h: 0, failed_24h: 0 });
        setLoading(false);
    };

    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 5000);
        return () => clearInterval(interval);
    }, []);

    const toggleExpand = async (mid: string) => {
        if (expandedId === mid) { setExpandedId(null); return; }
        setExpandedId(mid);
        if (!runsById[mid]) {
            const res = await fetch(`/api/admin/missions?missionId=${mid}`);
            const j = await res.json();
            setRunsById(prev => ({ ...prev, [mid]: j.runs ?? [] }));
        }
    };

    const cliCommand = missionGoal.trim()
        ? `claude "Use the marketing-orchestrator subagent. Mission: ${missionGoal.replace(/"/g, '\\"')}"`
        : '';

    const copyCli = async () => {
        if (!cliCommand) return;
        await navigator.clipboard.writeText(cliCommand);
    };

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            <div className="fixed top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                <div className="max-w-7xl mx-auto">
                    <Link href="/admin/outreach" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-4">
                        <ArrowLeft className="h-3 w-3" /> Back to Outreach
                    </Link>

                    {/* Hero */}
                    <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-8 md:p-10 shadow-xl shadow-blue-900/20">
                        <div
                            className="absolute inset-0 opacity-30 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.35) 1px, transparent 0)',
                                backgroundSize: '24px 24px',
                            }}
                        />
                        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/30 blur-[120px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
                        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-3">
                                    <Bot className="h-3 w-3" /> Mission Control
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.05]">
                                    Agent <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">missions</span>
                                </h1>
                                <p className="text-blue-100/80 text-sm mt-3 max-w-2xl leading-relaxed">
                                    Live activity feed for the marketing-orchestrator and its specialists (lead-hunter, lead-enricher, outreach-strategist, campaign-manager). Polls every 5s.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <KpiTile label="Total" value={totals.total} />
                                <KpiTile label="Running" value={totals.running} accent="blue" />
                                <KpiTile label="Succeeded · 24h" value={totals.succeeded_24h} accent="emerald" />
                                <KpiTile label="Failed · 24h" value={totals.failed_24h} accent={totals.failed_24h > 0 ? 'rose' : undefined} />
                            </div>
                        </div>
                    </div>

                    {/* Mission Launcher */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                                <Play className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-base font-black text-slate-900">Launch a mission</h2>
                                <p className="text-xs text-slate-500">Type a goal, copy the CLI command, paste it into a Claude Code terminal.</p>
                            </div>
                        </div>
                        <textarea
                            value={missionGoal}
                            onChange={e => setMissionGoal(e.target.value)}
                            rows={3}
                            placeholder="e.g. Find 30 dental practice owners in Mississauga and start LinkedIn outreach for Jane, leading with the Free AI Audit."
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 resize-none"
                        />
                        <div className="flex flex-wrap items-center gap-2 mt-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Templates:</span>
                            {TEMPLATES.map(t => (
                                <button
                                    key={t.label}
                                    onClick={() => setMissionGoal(t.text)}
                                    className="text-[11px] font-bold bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-100 hover:border-blue-100 px-3 py-1.5 rounded-full transition-colors"
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>
                        {cliCommand && (
                            <div className="mt-4 bg-slate-950 border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                                <pre className="flex-1 text-[11px] text-blue-200 font-mono whitespace-pre-wrap break-all leading-relaxed">{cliCommand}</pre>
                                <button
                                    onClick={copyCli}
                                    className="shrink-0 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors"
                                >
                                    <Clipboard className="h-3 w-3" /> Copy
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Activity feed */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
                            <Activity className="h-5 w-5 text-blue-600" />
                            <h2 className="text-base font-black text-slate-900">Activity feed</h2>
                            <span className="text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full uppercase tracking-widest ml-auto">
                                Live · 5s
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                            </div>
                        ) : missions.length === 0 ? (
                            <div className="px-6 py-16 text-center">
                                <Bot className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-medium">No missions yet.</p>
                                <p className="text-xs text-slate-400 mt-2">Launch one above to see live agent activity here.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {missions.map(m => {
                                    const expanded = expandedId === m.mission_id;
                                    const runs = runsById[m.mission_id] ?? [];
                                    return (
                                        <div key={m.mission_id} className={expanded ? 'bg-blue-50/30' : ''}>
                                            <button
                                                onClick={() => toggleExpand(m.mission_id)}
                                                className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors flex items-center gap-4"
                                            >
                                                <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${statusTone(m.status)}`}>
                                                    {m.status}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-slate-900 truncate">{m.goal || '(no goal recorded)'}</p>
                                                    <p className="text-[11px] text-slate-500 mt-0.5">
                                                        {m.agents.join(' → ')} · {m.agent_count} run{m.agent_count === 1 ? '' : 's'}
                                                    </p>
                                                </div>
                                                <div className="text-[11px] text-slate-500 tabular-nums shrink-0">{fmtRel(m.started_at)}</div>
                                            </button>

                                            {expanded && (
                                                <div className="px-6 pb-5 pt-1">
                                                    {runs.length === 0 ? (
                                                        <div className="text-xs text-slate-500 italic py-3">Loading runs…</div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {runs.map(r => (
                                                                <RunRow key={r.id} run={r} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function KpiTile({ label, value, accent }: { label: string; value: number; accent?: 'blue' | 'emerald' | 'rose' }) {
    const tone = accent === 'emerald' ? 'text-emerald-300'
        : accent === 'rose' ? 'text-rose-300'
        : accent === 'blue' ? 'text-blue-300'
        : 'text-white';
    return (
        <div className="bg-white/8 backdrop-blur border border-white/15 rounded-xl px-4 py-3">
            <div className={`text-2xl font-black tabular-nums leading-none ${tone}`}>{value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-200 mt-1">{label}</div>
        </div>
    );
}

function RunRow({ run }: { run: Run }) {
    const [open, setOpen] = useState(false);
    const Icon = run.status === 'succeeded' ? CheckCircle2
        : run.status === 'failed' ? AlertCircle
        : run.status === 'running' ? Loader2
        : Sparkles;
    const tone = run.status === 'succeeded' ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
        : run.status === 'failed' ? 'text-rose-600 bg-rose-50 border-rose-100'
        : run.status === 'running' ? 'text-blue-600 bg-blue-50 border-blue-100'
        : 'text-slate-500 bg-slate-50 border-slate-100';
    return (
        <div className="bg-white border border-slate-100 rounded-xl p-3">
            <button onClick={() => setOpen(!open)} className="w-full text-left flex items-center gap-3">
                <div className={`h-7 w-7 rounded-md border flex items-center justify-center shrink-0 ${tone}`}>
                    <Icon className={`h-3.5 w-3.5 ${run.status === 'running' ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900">{run.agent_name}</div>
                    <div className="text-[11px] text-slate-500 truncate">{run.task ?? '—'}</div>
                </div>
                {run.affected_count != null && (
                    <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                        {run.affected_count} {run.affected_table ?? ''}
                    </span>
                )}
                <div className="text-[10px] text-slate-500 tabular-nums shrink-0">{fmtRel(run.started_at)}</div>
                <ChevronRight className={`h-3 w-3 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
            </button>
            {open && (
                <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <KvBlock label="Input" data={run.input} />
                    <KvBlock label="Output" data={run.output ?? run.error} />
                </div>
            )}
        </div>
    );
}

function KvBlock({ label, data }: { label: string; data: any }) {
    return (
        <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</div>
            <pre className="text-[10px] bg-slate-50 border border-slate-100 rounded-lg p-3 overflow-x-auto text-slate-700 font-mono">
                {data == null ? '—' : typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
            </pre>
        </div>
    );
}
