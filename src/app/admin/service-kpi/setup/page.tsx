'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Copy, RefreshCw, Database, KeyRound, ListChecks } from 'lucide-react';

interface PingResult { ok: boolean; error?: string; status?: number; info?: Record<string, unknown> }
interface SyncSummary { ok: boolean; count?: number; error?: string }

const ENV_TEMPLATE = `# ConnectWise Manage REST API
CW_SITE=api-na.myconnectwise.net
CW_COMPANY_ID=audcomp
CW_PUBLIC_KEY=
CW_PRIVATE_KEY=
CW_CLIENT_ID=
CW_PENDING_CLOSURE_STATUSES=Pending Closure

# SmileBack CSAT (optional — alternative is CW Surveys)
SMILEBACK_API_TOKEN=
`;

const STEPS: { id: string; title: string; body: React.ReactNode }[] = [
    {
        id: 'creds',
        title: '1. Generate ConnectWise API keys',
        body: (
            <>
                <p>In ConnectWise Manage, go to <strong>System → Members → API Members</strong>, create or edit an API member with permissions for <em>Service Tickets, Service Boards, System</em>, then under that member generate a <strong>Public Key</strong> and <strong>Private Key</strong>. The <em>Client ID</em> is your registered integrator GUID from <a className="text-blue-600 underline" href="https://developer.connectwise.com/ClientID" target="_blank" rel="noreferrer">developer.connectwise.com/ClientID</a>.</p>
                <p>You will also need your <em>Company ID</em> (the short login slug you use to sign into Manage) and the <em>API site host</em> (e.g. <code className="px-1 bg-slate-100 rounded">api-na.myconnectwise.net</code> for North America).</p>
            </>
        ),
    },
    {
        id: 'env',
        title: '2. Add environment variables',
        body: (
            <p>Drop the values into <code className="px-1 bg-slate-100 rounded">.env.local</code> at the project root and restart the dev server. The template below is ready to copy.</p>
        ),
    },
    {
        id: 'migrate',
        title: '3. Run the Supabase migration',
        body: (
            <p>Apply <code className="px-1 bg-slate-100 rounded">supabase/migrations/connectwise_service_kpi.sql</code> against your Supabase project. This creates <code className="text-xs">cw_tickets</code>, <code className="text-xs">cw_monitored_boards</code>, <code className="text-xs">cw_sync_runs</code>, and the location/department lookup tables.</p>
        ),
    },
    {
        id: 'test',
        title: '4. Test the connection',
        body: <p>Click <em>Test connection</em> below to hit <code className="px-1 bg-slate-100 rounded">/api/connectwise/ping</code>. A green check means auth + clientId + permissions are all good.</p>,
    },
    {
        id: 'sync',
        title: '5. Sync metadata',
        body: <p>Pull locations, departments, and boards from ConnectWise. Existing checkbox selections are preserved on re-sync.</p>,
    },
    {
        id: 'pick',
        title: '6. Pick boards in the dashboard',
        body: (
            <p>
                Open the <Link href="/admin/service-kpi" className="text-blue-600 underline">Service KPI dashboard → Settings tab</Link>, check Helpdesk (and any others) under Today / Pending Closure / SLA, and you&apos;re done.
            </p>
        ),
    },
];

export default function ServiceKpiSetupPage() {
    const [ping, setPing] = useState<PingResult | null>(null);
    const [pinging, setPinging] = useState(false);
    const [syncStatus, setSyncStatus] = useState<Record<string, SyncSummary | 'pending'>>({});
    const [copied, setCopied] = useState(false);
    const [counts, setCounts] = useState<{ boards: number; tickets: number; runs: number } | null>(null);

    const loadCounts = async () => {
        const [b, t, r] = await Promise.all([
            fetch('/api/connectwise/boards').then(r => r.json()).catch(() => ({})),
            fetch('/api/connectwise/tickets?scope=open').then(r => r.json()).catch(() => ({})),
            fetch('/api/connectwise/sync-runs').then(r => r.json()).catch(() => ({})),
        ]);
        setCounts({
            boards: b.sample ? 0 : (b.boards?.length ?? 0),
            tickets: t.sample ? 0 : (t.tickets?.length ?? 0),
            runs: r.runs?.length ?? 0,
        });
    };

    useEffect(() => { loadCounts(); }, []);

    const runPing = async () => {
        setPinging(true);
        const r = await fetch('/api/connectwise/ping').then(r => r.json());
        setPing(r);
        setPinging(false);
    };

    const runSync = async (kind: 'locations' | 'departments' | 'boards') => {
        setSyncStatus(s => ({ ...s, [kind]: 'pending' }));
        const r = await fetch(`/api/connectwise/sync/${kind}`, { method: 'POST' }).then(r => r.json());
        setSyncStatus(s => ({ ...s, [kind]: r }));
        loadCounts();
    };

    const runSyncAll = async () => {
        const kinds = ['locations', 'departments', 'boards'] as const;
        setSyncStatus(s => kinds.reduce((acc, k) => ({ ...acc, [k]: 'pending' }), { ...s }));
        const results = await Promise.all(
            kinds.map(k =>
                fetch(`/api/connectwise/sync/${k}`, { method: 'POST' })
                    .then(r => r.json())
                    .then(r => [k, r] as const)
                    .catch(err => [k, { ok: false, error: err.message ?? 'Network error' }] as const)
            )
        );
        setSyncStatus(s => results.reduce((acc, [k, r]) => ({ ...acc, [k]: r }), { ...s }));
        loadCounts();
    };

    const copyEnv = async () => {
        await navigator.clipboard.writeText(ENV_TEMPLATE);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen">
            <header className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white">
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.4) 1px, transparent 0)',
                        backgroundSize: '20px 20px',
                    }}
                />
                <div className="relative px-8 pt-10 pb-8">
                    <Link href="/admin/service-kpi" className="inline-flex items-center gap-2 text-blue-200 hover:text-white text-sm mb-4">
                        <ArrowLeft className="h-4 w-4" /> Back to Service KPI
                    </Link>
                    <h1 className="text-3xl font-black tracking-tight">
                        Service KPI <span className="text-blue-300">Setup</span>
                    </h1>
                    <p className="mt-2 text-slate-300 text-sm max-w-2xl">
                        Connect ConnectWise Manage and (optionally) SmileBack so the dashboard pulls real ticket and CSAT data. Until this is done, the dashboard renders placeholder sample data.
                    </p>
                </div>
            </header>

            <main className="px-8 py-8 space-y-6 max-w-5xl">
                {/* Status overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatusCard
                        icon={KeyRound}
                        label="ConnectWise"
                        value={ping ? (ping.ok ? 'Connected' : 'Not connected') : 'Untested'}
                        tone={ping?.ok ? 'good' : ping ? 'bad' : 'neutral'}
                    />
                    <StatusCard
                        icon={Database}
                        label="Synced boards"
                        value={counts ? `${counts.boards}` : '—'}
                        tone={counts && counts.boards > 0 ? 'good' : 'neutral'}
                    />
                    <StatusCard
                        icon={ListChecks}
                        label="Synced tickets"
                        value={counts ? `${counts.tickets}` : '—'}
                        tone={counts && counts.tickets > 0 ? 'good' : 'neutral'}
                    />
                </div>

                {/* Steps */}
                {STEPS.map(step => (
                    <section key={step.id} className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
                        <h2 className="font-bold text-slate-900 text-lg">{step.title}</h2>
                        <div className="mt-2 text-sm text-slate-600 space-y-2">{step.body}</div>

                        {step.id === 'env' && (
                            <div className="mt-4 relative">
                                <pre className="bg-slate-950 text-slate-100 text-xs rounded-xl p-4 overflow-x-auto font-mono">{ENV_TEMPLATE}</pre>
                                <button
                                    onClick={copyEnv}
                                    className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-md bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-100 hover:bg-slate-700"
                                >
                                    <Copy className="h-3 w-3" /> {copied ? 'Copied' : 'Copy'}
                                </button>
                            </div>
                        )}

                        {step.id === 'test' && (
                            <div className="mt-4 flex items-center gap-3">
                                <button
                                    onClick={runPing}
                                    disabled={pinging}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                                >
                                    {pinging ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                    Test connection
                                </button>
                                {ping && (
                                    <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${ping.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {ping.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                        {ping.ok ? 'Connected' : ping.error}
                                    </span>
                                )}
                            </div>
                        )}

                        {step.id === 'sync' && (
                            <div className="mt-4">
                                <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
                                    <button
                                        onClick={runSyncAll}
                                        disabled={(['locations','departments','boards'] as const).some(k => syncStatus[k] === 'pending')}
                                        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white hover:from-blue-500 hover:to-indigo-500 shadow-md shadow-blue-600/20 disabled:opacity-60"
                                    >
                                        {(['locations','departments','boards'] as const).some(k => syncStatus[k] === 'pending')
                                            ? <Loader2 className="h-4 w-4 animate-spin" />
                                            : <RefreshCw className="h-4 w-4" />
                                        }
                                        Sync everything
                                    </button>
                                    <span className="text-xs text-slate-500">Runs locations, departments, and boards in parallel.</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {(['locations', 'departments', 'boards'] as const).map(k => {
                                        const s = syncStatus[k];
                                        const pending = s === 'pending';
                                        const result = (s && s !== 'pending') ? s : null;
                                        return (
                                            <button
                                                key={k}
                                                onClick={() => runSync(k)}
                                                disabled={pending}
                                                title={result && !result.ok ? (result.error ?? 'fail') : undefined}
                                                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                            >
                                                <span className="capitalize flex items-center gap-2">
                                                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-blue-600" />}
                                                    Sync {k}
                                                </span>
                                                {result && (
                                                    <span className={`text-xs ${result.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                                                        {result.ok ? `${result.count ?? 0}` : 'fail'}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                {(['locations','departments','boards'] as const)
                                    .map(k => syncStatus[k])
                                    .filter((s): s is { ok: false; error?: string } => !!s && s !== 'pending' && (s as any).ok === false)
                                    .slice(0, 1)
                                    .map((errResult, i) => (
                                        <div key={i} className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">
                                            <strong className="font-bold">Sync failed:</strong> {errResult.error ?? 'Unknown error'}
                                            {(errResult.error ?? '').includes('403') && (
                                                <p className="mt-1 text-red-600">
                                                    The API member's role doesn't have <em>Inquire</em> permission on these endpoints. In ConnectWise: <strong>System → Members → API Members → [your key] → Role ID</strong> — make sure that role has <em>System &gt; Locations</em>, <em>System &gt; Departments</em>, and <em>Service &gt; Service Boards</em> set to <strong>All</strong> for Inquire-Level access.
                                                </p>
                                            )}
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                    </section>
                ))}

                <p className="text-xs text-slate-500">
                    Until ConnectWise is connected, the dashboard pages return placeholder sample data so you can preview the UI. Real data appears automatically as soon as a sync run completes.
                </p>
            </main>
        </div>
    );
}

function StatusCard({ icon: Icon, label, value, tone }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; tone: 'good' | 'bad' | 'neutral' }) {
    const tones = {
        good: 'from-emerald-500 to-green-600 text-emerald-600',
        bad: 'from-red-500 to-rose-600 text-red-600',
        neutral: 'from-slate-400 to-slate-500 text-slate-500',
    } as const;
    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${tones[tone]} text-white`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{label}</p>
                <p className={`text-lg font-black ${tones[tone].split(' ').pop()}`}>{value}</p>
            </div>
        </div>
    );
}
