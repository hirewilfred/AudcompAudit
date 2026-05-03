'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Loader2, RefreshCw, Settings as SettingsIcon, AlertTriangle, ListChecks, Activity, CheckCircle2, Wrench, Info } from 'lucide-react';

type Tab = 'today' | 'sla' | 'kpis' | 'settings';

interface BoardRow {
    board_id: number;
    board_name: string;
    location_name: string | null;
    department_name: string | null;
    monitor_today: boolean;
    monitor_pending_closure: boolean;
    monitor_sla: boolean;
    enabled: boolean;
}

interface TicketRow {
    id: number;
    summary: string | null;
    status_name: string | null;
    board_name: string | null;
    priority_name: string | null;
    priority_sort: number | null;
    company_name: string | null;
    contact_name: string | null;
    resources: string | null;
    age_days: number | null;
    actual_hours: number | null;
    required_date: string | null;
    minutes_until_breach: number | null;
    date_entered: string | null;
}

interface SyncRun {
    id: string;
    scope: string;
    started_at: string;
    finished_at: string | null;
    record_count: number | null;
    success: boolean | null;
    error_message: string | null;
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'today', label: "Today's Board", icon: ListChecks },
    { id: 'sla', label: 'SLA Dashboard', icon: AlertTriangle },
    { id: 'kpis', label: 'KPIs', icon: Activity },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

const HEADER_GRADIENT =
    'relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white';

export default function ServiceKpiPage() {
    const [tab, setTab] = useState<Tab>('today');
    const [usingSample, setUsingSample] = useState(false);

    useEffect(() => {
        fetch('/api/connectwise/tickets?scope=today')
            .then(r => r.json())
            .then(d => setUsingSample(Boolean(d.sample)))
            .catch(() => {});
    }, []);

    return (
        <div className="min-h-screen">
            <header className={HEADER_GRADIENT}>
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.4) 1px, transparent 0)',
                        backgroundSize: '20px 20px',
                    }}
                />
                <div className="relative px-8 pt-10 pb-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight">
                                Service <span className="text-blue-300">KPI</span>
                            </h1>
                            <p className="mt-2 text-slate-300 text-sm max-w-2xl">
                                Live ConnectWise board view, SLA monitoring, and helpdesk KPIs. Pick which
                                boards to watch in Settings — Helpdesk by default.
                            </p>
                        </div>
                        <Link
                            href="/admin/service-kpi/setup"
                            className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-sm font-semibold text-white"
                        >
                            <Wrench className="h-4 w-4" /> Setup &amp; Configuration
                        </Link>
                    </div>
                    {usingSample && (
                        <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-amber-500/15 border border-amber-400/30 px-3 py-2 text-xs font-semibold text-amber-200">
                            <Info className="h-4 w-4" />
                            Showing placeholder sample data — finish <Link href="/admin/service-kpi/setup" className="underline">setup</Link> to pull live ConnectWise tickets.
                        </div>
                    )}
                    <nav className="mt-6 flex gap-1 border-b border-slate-800/40">
                        {TABS.map(t => {
                            const active = tab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
                                        active
                                            ? 'text-white border-blue-400'
                                            : 'text-slate-400 border-transparent hover:text-slate-200'
                                    }`}
                                >
                                    <t.icon className="h-4 w-4" />
                                    {t.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </header>

            <main className="px-8 py-8">
                {tab === 'today' && <TodayBoardTab />}
                {tab === 'sla' && <SlaDashboardTab />}
                {tab === 'kpis' && <KpisTab />}
                {tab === 'settings' && <SettingsTab />}
            </main>
        </div>
    );
}

// ----------------------------- Today's Board -----------------------------

function TodayBoardTab() {
    const [today, setToday] = useState<TicketRow[]>([]);
    const [pending, setPending] = useState<TicketRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const load = async () => {
        setLoading(true);
        const [t, p] = await Promise.all([
            fetch('/api/connectwise/tickets?scope=today').then(r => r.json()),
            fetch('/api/connectwise/tickets?scope=pending').then(r => r.json()),
        ]);
        setToday(t.tickets ?? []);
        setPending(p.tickets ?? []);
        setLoading(false);
    };

    const refresh = async () => {
        setRefreshing(true);
        await Promise.all([
            fetch('/api/connectwise/sync/daily', { method: 'POST' }),
            fetch('/api/connectwise/sync/pending-closure', { method: 'POST' }),
        ]);
        await load();
        setRefreshing(false);
    };

    useEffect(() => { load(); }, []);

    return (
        <div className="space-y-6">
            <ActionBar
                left={<>Real-time view of selected boards. Refresh pulls live from ConnectWise.</>}
                right={
                    <button
                        onClick={refresh}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Refresh from ConnectWise
                    </button>
                }
            />
            <TicketGrid title="Created Today" tickets={today} loading={loading} />
            <TicketGrid title="Pending Closure" tickets={pending} loading={loading} />
        </div>
    );
}

function TicketGrid({ title, tickets, loading }: { title: string; tickets: TicketRow[]; loading: boolean }) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <SectionTitle>{title}</SectionTitle>
                <span className="text-xs font-semibold text-slate-500">
                    {loading ? '…' : `${tickets.length} ticket${tickets.length === 1 ? '' : 's'}`}
                </span>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="text-left px-4 py-2.5 font-semibold">Ticket #</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Company</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Summary</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Priority</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Resources</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Age</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Hours</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Board</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                            <th className="text-left px-4 py-2.5 font-semibold">Contact</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tickets.length === 0 && !loading && (
                            <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">No tickets</td></tr>
                        )}
                        {loading && (
                            <tr><td colSpan={10} className="px-4 py-8 text-center text-slate-400">
                                <Loader2 className="h-4 w-4 animate-spin inline" />
                            </td></tr>
                        )}
                        {tickets.map(t => (
                            <tr key={t.id} className="hover:bg-blue-50/50">
                                <td className="px-4 py-2 text-blue-600 font-semibold">{t.id}</td>
                                <td className="px-4 py-2">{t.company_name}</td>
                                <td className="px-4 py-2 max-w-md truncate text-blue-700">{t.summary}</td>
                                <td className="px-4 py-2"><PriorityChip name={t.priority_name} sort={t.priority_sort} /></td>
                                <td className="px-4 py-2 text-slate-700">{t.resources}</td>
                                <td className="px-4 py-2 text-right tabular-nums">{t.age_days?.toFixed(1) ?? '—'}</td>
                                <td className="px-4 py-2 text-right tabular-nums">{t.actual_hours?.toFixed(2) ?? '0.00'}</td>
                                <td className="px-4 py-2">{t.board_name}</td>
                                <td className="px-4 py-2"><StatusChip name={t.status_name} /></td>
                                <td className="px-4 py-2 text-slate-700">{t.contact_name}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function PriorityChip({ name, sort }: { name: string | null; sort: number | null }) {
    const colors: Record<number, string> = {
        1: 'bg-red-500',
        2: 'bg-orange-500',
        3: 'bg-yellow-400',
        4: 'bg-blue-500',
        5: 'bg-slate-400',
    };
    const color = colors[sort ?? 5] ?? 'bg-slate-300';
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`inline-block w-3 h-3 rounded-sm ${color}`} />
            <span className="text-xs text-slate-600">{name ?? '—'}</span>
        </span>
    );
}

function StatusChip({ name }: { name: string | null }) {
    if (!name) return <span className="text-slate-400">—</span>;
    const lc = name.toLowerCase();
    const cls = lc.includes('pending') ? 'bg-amber-100 text-amber-800'
        : lc.includes('new') ? 'bg-emerald-100 text-emerald-800'
        : lc.includes('triag') ? 'bg-blue-100 text-blue-800'
        : lc.includes('closed') ? 'bg-slate-100 text-slate-600'
        : 'bg-slate-100 text-slate-700';
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{name}</span>;
}

// ----------------------------- SLA Dashboard -----------------------------

function SlaDashboardTab() {
    const [tickets, setTickets] = useState<TicketRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [csat, setCsat] = useState<{ csat_percent: number | null; total: number; positive: number; negative: number } | null>(null);
    const [lastRun, setLastRun] = useState<SyncRun | null>(null);

    const load = async () => {
        setLoading(true);
        const [t, c, runs] = await Promise.all([
            fetch('/api/connectwise/tickets?scope=sla').then(r => r.json()),
            fetch('/api/connectwise/csat?days=30').then(r => r.json()).catch(() => null),
            fetch('/api/connectwise/sync-runs?scope=sla_check').then(r => r.json()),
        ]);
        setTickets(t.tickets ?? []);
        setCsat(c?.ok ? c : null);
        setLastRun(runs.runs?.[0] ?? null);
        setLoading(false);
    };

    const runCheck = async () => {
        setRefreshing(true);
        await fetch('/api/connectwise/sync/sla-check', { method: 'POST' });
        await load();
        setRefreshing(false);
    };

    useEffect(() => {
        load();
        const id = setInterval(load, 60_000);
        return () => clearInterval(id);
    }, []);

    const breached = tickets.filter(t => (t.minutes_until_breach ?? 1) < 0).length;
    const atRisk = tickets.filter(t => {
        const m = t.minutes_until_breach;
        return m !== null && m >= 0 && m < 60;
    }).length;
    const safe = tickets.length - breached - atRisk;

    return (
        <div className="space-y-6">
            <ActionBar
                left={
                    <>
                        Auto-refreshes every 60s.{' '}
                        {lastRun && (
                            <span className="text-slate-500">
                                Last live check: {new Date(lastRun.started_at).toLocaleTimeString()}
                            </span>
                        )}
                    </>
                }
                right={
                    <button
                        onClick={runCheck}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Run live SLA check
                    </button>
                }
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Open tickets" value={tickets.length} tone="neutral" />
                <StatCard label="SLA breached" value={breached} tone="bad" />
                <StatCard label="At risk (<60m)" value={atRisk} tone="warn" />
                <StatCard label="Within SLA" value={safe} tone="good" />
            </div>

            {csat && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="CSAT (30d)" value={csat.csat_percent != null ? `${csat.csat_percent}%` : '—'} tone="good" />
                    <StatCard label="Positive responses" value={csat.positive} tone="good" />
                    <StatCard label="Negative responses" value={csat.negative} tone="bad" />
                </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                    <SectionTitle>SLA Watch</SectionTitle>
                    <span className="text-xs font-semibold text-slate-500">{tickets.length} open</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-semibold">Ticket #</th>
                                <th className="text-left px-4 py-2.5 font-semibold">Company</th>
                                <th className="text-left px-4 py-2.5 font-semibold">Summary</th>
                                <th className="text-left px-4 py-2.5 font-semibold">Board</th>
                                <th className="text-left px-4 py-2.5 font-semibold">Resources</th>
                                <th className="text-left px-4 py-2.5 font-semibold">Required</th>
                                <th className="text-right px-4 py-2.5 font-semibold">Time to breach</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                                    <Loader2 className="h-4 w-4 animate-spin inline" />
                                </td></tr>
                            )}
                            {!loading && tickets.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No open tickets with SLA data</td></tr>
                            )}
                            {tickets.map(t => (
                                <tr key={t.id} className="hover:bg-blue-50/50">
                                    <td className="px-4 py-2 text-blue-600 font-semibold">{t.id}</td>
                                    <td className="px-4 py-2">{t.company_name}</td>
                                    <td className="px-4 py-2 max-w-md truncate text-blue-700">{t.summary}</td>
                                    <td className="px-4 py-2">{t.board_name}</td>
                                    <td className="px-4 py-2 text-slate-700">{t.resources}</td>
                                    <td className="px-4 py-2 text-slate-700">
                                        {t.required_date ? new Date(t.required_date).toLocaleString() : '—'}
                                    </td>
                                    <td className="px-4 py-2 text-right"><BreachChip minutes={t.minutes_until_breach} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function BreachChip({ minutes }: { minutes: number | null }) {
    if (minutes === null) return <span className="text-slate-400">—</span>;
    const breached = minutes < 0;
    const atRisk = minutes >= 0 && minutes < 60;
    const cls = breached
        ? 'bg-red-100 text-red-800'
        : atRisk
            ? 'bg-amber-100 text-amber-800'
            : 'bg-emerald-100 text-emerald-800';
    const label = breached
        ? `Breached ${formatMins(-minutes)} ago`
        : `${formatMins(minutes)} left`;
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
}

function formatMins(m: number) {
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60); const r = m % 60;
    if (h < 24) return `${h}h ${r}m`;
    const d = Math.floor(h / 24); const rh = h % 24;
    return `${d}d ${rh}h`;
}

// ----------------------------- KPIs -----------------------------

interface TechKpiRow {
    tech: string;
    assigned_to_me: number;
    touched: number;
    closed_by_me: number;
    open: number;
    avg_hours: number;
    closure_rate: number;
}

function KpisTab() {
    const [tickets, setTickets] = useState<TicketRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [techRows, setTechRows] = useState<TechKpiRow[]>([]);
    const [techDays, setTechDays] = useState(7);
    const [techLoading, setTechLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch('/api/connectwise/tickets?scope=open')
            .then(r => r.json())
            .then(d => setTickets(d.tickets ?? []))
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        setTechLoading(true);
        fetch(`/api/connectwise/tech-kpis?days=${techDays}`)
            .then(r => r.json())
            .then(d => setTechRows(d.rows ?? []))
            .finally(() => setTechLoading(false));
    }, [techDays]);

    const byBoard = useMemo(() => {
        const m = new Map<string, number>();
        tickets.forEach(t => {
            const k = t.board_name ?? 'Unknown';
            m.set(k, (m.get(k) ?? 0) + 1);
        });
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
    }, [tickets]);

    const byResource = useMemo(() => {
        const m = new Map<string, number>();
        tickets.forEach(t => {
            const k = t.resources ?? 'Unassigned';
            m.set(k, (m.get(k) ?? 0) + 1);
        });
        return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    }, [tickets]);

    const byStatus = useMemo(() => {
        const m = new Map<string, number>();
        tickets.forEach(t => {
            const k = t.status_name ?? 'Unknown';
            m.set(k, (m.get(k) ?? 0) + 1);
        });
        return [...m.entries()].sort((a, b) => b[1] - a[1]);
    }, [tickets]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard label="Open tickets" value={tickets.length} tone="neutral" />
                <StatCard
                    label="Avg age (days)"
                    value={tickets.length
                        ? (tickets.reduce((s, t) => s + (t.age_days ?? 0), 0) / tickets.length).toFixed(1)
                        : '—'}
                    tone="neutral"
                />
                <StatCard
                    label="Avg actual hours"
                    value={tickets.length
                        ? (tickets.reduce((s, t) => s + (t.actual_hours ?? 0), 0) / tickets.length).toFixed(2)
                        : '—'}
                    tone="neutral"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <BarPanel title="Open tickets by board" rows={byBoard} loading={loading} />
                <BarPanel title="Open tickets by resource" rows={byResource} loading={loading} />
                <BarPanel title="Open tickets by status" rows={byStatus} loading={loading} />
            </div>

            <TechKpiPanel rows={techRows} days={techDays} setDays={setTechDays} loading={techLoading} />
        </div>
    );
}

function TechKpiPanel({ rows, days, setDays, loading }: { rows: TechKpiRow[]; days: number; setDays: (n: number) => void; loading: boolean }) {
    const totals = rows.reduce(
        (acc, r) => {
            acc.assigned += r.assigned_to_me;
            acc.touched += r.touched;
            acc.closed += r.closed_by_me;
            acc.open += r.open;
            return acc;
        },
        { assigned: 0, touched: 0, closed: 0, open: 0 },
    );
    const maxAssigned = Math.max(1, ...rows.map(r => r.assigned_to_me));

    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <SectionTitle>Per-tech KPIs</SectionTitle>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Window</span>
                    {[1, 7, 14, 30].map(d => (
                        <button
                            key={d}
                            onClick={() => setDays(d)}
                            className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${
                                days === d
                                    ? 'bg-blue-600 border-blue-600 text-white'
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {d === 1 ? '1d' : `${d}d`}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4 border-b border-slate-100 bg-slate-50/40">
                <MiniStat label="Came in" value={totals.assigned} />
                <MiniStat label="Touched" value={totals.touched} />
                <MiniStat label="Closed" value={totals.closed} />
                <MiniStat label="Still open" value={totals.open} />
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                        <tr>
                            <th className="text-left px-4 py-2.5 font-semibold">Tech</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Came in (assigned)</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Touched</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Closed</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Still open</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Closure rate</th>
                            <th className="text-right px-4 py-2.5 font-semibold">Avg hrs</th>
                            <th className="text-left px-4 py-2.5 font-semibold w-1/4">Volume</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && (
                            <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                                <Loader2 className="h-4 w-4 animate-spin inline" />
                            </td></tr>
                        )}
                        {!loading && rows.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400">No tech activity in the selected window</td></tr>
                        )}
                        {rows.map(r => {
                            const rateColor = r.closure_rate >= 80 ? 'bg-emerald-100 text-emerald-800'
                                : r.closure_rate >= 50 ? 'bg-blue-100 text-blue-800'
                                : r.closure_rate >= 25 ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800';
                            return (
                                <tr key={r.tech} className="hover:bg-blue-50/40">
                                    <td className="px-4 py-2 font-semibold text-slate-800">{r.tech}</td>
                                    <td className="px-4 py-2 text-right tabular-nums">{r.assigned_to_me}</td>
                                    <td className="px-4 py-2 text-right tabular-nums">{r.touched}</td>
                                    <td className="px-4 py-2 text-right tabular-nums font-semibold text-emerald-700">{r.closed_by_me}</td>
                                    <td className="px-4 py-2 text-right tabular-nums text-slate-600">{r.open}</td>
                                    <td className="px-4 py-2 text-right">
                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${rateColor}`}>
                                            {r.closure_rate}%
                                        </span>
                                    </td>
                                    <td className="px-4 py-2 text-right tabular-nums">{r.avg_hours.toFixed(2)}</td>
                                    <td className="px-4 py-2">
                                        <div className="bg-slate-100 rounded h-2 overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                                style={{ width: `${(r.assigned_to_me / maxAssigned) * 100}%` }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}

function MiniStat({ label, value }: { label: string; value: number }) {
    return (
        <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className="text-2xl font-black text-slate-800 tabular-nums">{value}</p>
        </div>
    );
}

function BarPanel({ title, rows, loading }: { title: string; rows: [string, number][]; loading: boolean }) {
    const max = Math.max(1, ...rows.map(r => r[1]));
    return (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100"><SectionTitle>{title}</SectionTitle></div>
            <div className="p-5 space-y-2">
                {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                {!loading && rows.length === 0 && <p className="text-sm text-slate-400">No data</p>}
                {rows.map(([k, v]) => (
                    <div key={k} className="flex items-center gap-3">
                        <span className="w-40 truncate text-sm text-slate-700">{k}</span>
                        <div className="flex-1 bg-slate-100 rounded h-3 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                style={{ width: `${(v / max) * 100}%` }}
                            />
                        </div>
                        <span className="w-10 text-right text-sm tabular-nums font-semibold text-slate-700">{v}</span>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ----------------------------- Settings -----------------------------

function SettingsTab() {
    const [boards, setBoards] = useState<BoardRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState<string | null>(null);
    const [pingState, setPingState] = useState<'idle' | 'ok' | 'fail'>('idle');
    const [pingMsg, setPingMsg] = useState<string>('');
    const [filter, setFilter] = useState({ location: '', department: '', search: '' });

    const load = async () => {
        setLoading(true);
        const r = await fetch('/api/connectwise/boards').then(r => r.json());
        setBoards(r.boards ?? []);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const syncAll = async () => {
        setSyncing('metadata');
        await fetch('/api/connectwise/sync/locations', { method: 'POST' });
        await fetch('/api/connectwise/sync/departments', { method: 'POST' });
        await fetch('/api/connectwise/sync/boards', { method: 'POST' });
        await load();
        setSyncing(null);
    };

    const ping = async () => {
        setPingState('idle');
        const r = await fetch('/api/connectwise/ping').then(r => r.json());
        setPingState(r.ok ? 'ok' : 'fail');
        setPingMsg(r.ok ? 'Connection OK' : (r.error || 'Failed'));
    };

    const toggle = async (board: BoardRow, field: 'monitor_today' | 'monitor_pending_closure' | 'monitor_sla') => {
        const next = { ...board, [field]: !board[field] };
        setBoards(prev => prev.map(b => b.board_id === board.board_id ? next : b));
        await fetch('/api/connectwise/boards', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ board_id: board.board_id, [field]: next[field] }),
        });
    };

    const locations = [...new Set(boards.map(b => b.location_name).filter(Boolean) as string[])].sort();
    const departments = [...new Set(boards.map(b => b.department_name).filter(Boolean) as string[])].sort();

    const filtered = boards.filter(b => {
        if (filter.location && b.location_name !== filter.location) return false;
        if (filter.department && b.department_name !== filter.department) return false;
        if (filter.search && !b.board_name.toLowerCase().includes(filter.search.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <ActionBar
                left={
                    <>
                        Pick which boards feed each view. Changes save instantly.
                        {pingState !== 'idle' && (
                            <span className={`ml-3 text-xs font-semibold ${pingState === 'ok' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {pingMsg}
                            </span>
                        )}
                    </>
                }
                right={
                    <div className="flex gap-2">
                        <button
                            onClick={ping}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            <CheckCircle2 className="h-4 w-4" /> Test connection
                        </button>
                        <button
                            onClick={syncAll}
                            disabled={syncing !== null}
                            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Sync boards from ConnectWise
                        </button>
                    </div>
                }
            />

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                    <SectionTitle>Boards</SectionTitle>
                    <div className="ml-auto flex gap-2">
                        <select
                            value={filter.location}
                            onChange={e => setFilter(f => ({ ...f, location: e.target.value }))}
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                        >
                            <option value="">All locations</option>
                            {locations.map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                        <select
                            value={filter.department}
                            onChange={e => setFilter(f => ({ ...f, department: e.target.value }))}
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                        >
                            <option value="">All departments</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <input
                            placeholder="Search board…"
                            value={filter.search}
                            onChange={e => setFilter(f => ({ ...f, search: e.target.value }))}
                            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="text-left px-4 py-2.5 font-semibold">Board</th>
                                <th className="text-left px-4 py-2.5 font-semibold">Location</th>
                                <th className="text-left px-4 py-2.5 font-semibold">Department</th>
                                <th className="text-center px-4 py-2.5 font-semibold">Today</th>
                                <th className="text-center px-4 py-2.5 font-semibold">Pending Closure</th>
                                <th className="text-center px-4 py-2.5 font-semibold">SLA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                    <Loader2 className="h-4 w-4 animate-spin inline" />
                                </td></tr>
                            )}
                            {!loading && filtered.length === 0 && (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                                    No boards. Click &quot;Sync boards from ConnectWise&quot; to pull them in.
                                </td></tr>
                            )}
                            {filtered.map(b => (
                                <tr key={b.board_id} className={!b.enabled ? 'text-slate-400' : ''}>
                                    <td className="px-4 py-2 font-semibold">{b.board_name}</td>
                                    <td className="px-4 py-2 text-slate-600">{b.location_name ?? '—'}</td>
                                    <td className="px-4 py-2 text-slate-600">{b.department_name ?? '—'}</td>
                                    <td className="px-4 py-2 text-center"><Check value={b.monitor_today} onChange={() => toggle(b, 'monitor_today')} /></td>
                                    <td className="px-4 py-2 text-center"><Check value={b.monitor_pending_closure} onChange={() => toggle(b, 'monitor_pending_closure')} /></td>
                                    <td className="px-4 py-2 text-center"><Check value={b.monitor_sla} onChange={() => toggle(b, 'monitor_sla')} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
}

function Check({ value, onChange }: { value: boolean; onChange: () => void }) {
    return (
        <input
            type="checkbox"
            checked={value}
            onChange={onChange}
            className="h-4 w-4 accent-blue-600 cursor-pointer"
        />
    );
}

// ----------------------------- shared -----------------------------

function ActionBar({ left, right }: { left: React.ReactNode; right: React.ReactNode }) {
    return (
        <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
            <p className="text-sm text-slate-600">{left}</p>
            <div>{right}</div>
        </div>
    );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="font-semibold text-slate-900 text-base inline-block relative">
            {children}
            <span className="block h-[2px] mt-0.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-[length:200%_100%] animate-[gradient_3s_linear_infinite]" />
        </h2>
    );
}

function StatCard({ label, value, tone }: { label: string; value: number | string; tone: 'good' | 'bad' | 'warn' | 'neutral' }) {
    const tones = {
        good: 'from-emerald-500 to-green-600',
        bad: 'from-red-500 to-rose-600',
        warn: 'from-amber-500 to-orange-600',
        neutral: 'from-blue-500 to-indigo-600',
    } as const;
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
            <p className={`mt-1 text-3xl font-black bg-gradient-to-r ${tones[tone]} bg-clip-text text-transparent`}>{value}</p>
        </div>
    );
}
