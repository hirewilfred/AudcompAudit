'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, KeyRound, CheckCircle2, AlertCircle, Plus, Loader2,
    EyeOff, Trash2, Power, ShieldAlert, ChevronRight, Zap,
} from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';

const PROVIDERS = [
    { value: 'apify',          label: 'Apify',          desc: 'Web scraping for lead hunting (Apollo, Google Places, LinkedIn).' },
    { value: 'apollo',         label: 'Apollo.io',      desc: 'Email + firmographic enrichment for the lead-enricher agent.' },
    { value: 'instantly',      label: 'Instantly',      desc: 'Email send engine + warmup. Per-expert sending domains.' },
    { value: 'phantombuster',  label: 'PhantomBuster',  desc: 'LinkedIn automation phantoms (connect, message, engage).' },
    { value: 'resend',         label: 'Resend',         desc: 'Transactional email (notifications, expert reports).' },
    { value: 'linkedin_oauth', label: 'LinkedIn OAuth', desc: 'Per-expert OAuth tokens for posting from their account.' },
    { value: 'gmail_oauth',    label: 'Gmail OAuth',    desc: 'Per-expert Gmail tokens for direct send (alternative to Instantly).' },
] as const;

type Integration = {
    id: string;
    provider: typeof PROVIDERS[number]['value'];
    label: string;
    scope: 'global' | 'per_expert';
    expert_id: string | null;
    last4: string;
    is_active: boolean;
    rotated_at: string;
    last_test_at: string | null;
    last_test_ok: boolean | null;
    last_test_error: string | null;
};

export default function IntegrationsPage() {
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [showAdd, setShowAdd] = useState<{ provider: string } | null>(null);

    const refresh = async () => {
        setLoading(true);
        const res = await fetch('/api/admin/integrations');
        if (res.status === 403) { setForbidden(true); setLoading(false); return; }
        const json = await res.json();
        setIntegrations(json.integrations ?? []);
        setLoading(false);
    };

    useEffect(() => { refresh(); }, []);

    if (forbidden) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE] p-6">
            <div className="max-w-md w-full bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
                <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-slate-900 mb-4">Access Denied</h1>
                <p className="text-slate-500">Admin only.</p>
            </div>
        </div>
    );

    const byProvider = (p: string) => integrations.filter(i => i.provider === p);

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            <div className="fixed top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                <div className="max-w-6xl mx-auto">
                    <Link href="/admin/outreach" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-4">
                        <ArrowLeft className="h-3 w-3" /> Back to Outreach
                    </Link>

                    {/* Hero */}
                    <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-8 md:p-10 shadow-xl shadow-blue-900/20">
                        <div
                            className="absolute inset-0 opacity-30 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.35) 1px, transparent 0)',
                                backgroundSize: '24px 24px',
                            }}
                        />
                        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/30 blur-[120px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-3">
                                <KeyRound className="h-3 w-3" /> Integrations Vault
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.05]">
                                API <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">keys</span>
                            </h1>
                            <p className="text-blue-100/80 text-sm mt-3 max-w-2xl leading-relaxed">
                                Encrypted at rest with AES-256 (pgp_sym_encrypt). Keys are never echoed back — only the last 4 characters are visible.
                                Shared corporate keys are scoped <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">global</code>.
                                OAuth tokens for individual experts (LinkedIn, Gmail) are scoped <code className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">per_expert</code>.
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {PROVIDERS.map(p => {
                                const rows = byProvider(p.value);
                                const hasActive = rows.some(r => r.is_active);
                                return (
                                    <div key={p.value} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                                                    hasActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'
                                                }`}>
                                                    <KeyRound className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h2 className="text-base font-black text-slate-900">{p.label}</h2>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                                            hasActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                                        }`}>{hasActive ? 'Connected' : 'Not connected'}</span>
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium mt-0.5 max-w-2xl">{p.desc}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setShowAdd({ provider: p.value })}
                                                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm shadow-blue-600/20 transition-colors"
                                            >
                                                <Plus className="h-3.5 w-3.5" /> Add key
                                            </button>
                                        </div>

                                        {rows.length > 0 && (
                                            <div className="divide-y divide-slate-100">
                                                {rows.map(r => (
                                                    <IntegrationRow key={r.id} row={r} onRefresh={refresh} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {showAdd && (
                <AddKeyModal
                    provider={showAdd.provider}
                    onClose={() => setShowAdd(null)}
                    onSaved={() => { setShowAdd(null); refresh(); }}
                />
            )}
        </div>
    );
}

function IntegrationRow({ row, onRefresh }: { row: Integration; onRefresh: () => void }) {
    const [busy, setBusy] = useState(false);
    const [testing, setTesting] = useState(false);

    const toggle = async () => {
        setBusy(true);
        await fetch('/api/admin/integrations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: row.id, is_active: !row.is_active }),
        });
        onRefresh();
    };

    const remove = async () => {
        if (!confirm(`Delete "${row.label}"? This is irreversible.`)) return;
        setBusy(true);
        await fetch(`/api/admin/integrations?id=${row.id}`, { method: 'DELETE' });
        onRefresh();
    };

    const test = async () => {
        setTesting(true);
        await fetch('/api/admin/integrations/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: row.id }),
        });
        setTesting(false);
        onRefresh();
    };

    return (
        <div className="px-6 py-3.5 flex items-center gap-4 hover:bg-slate-50 transition-colors">
            <div className={`h-2 w-2 rounded-full shrink-0 ${row.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">{row.label}</div>
                <div className="text-[11px] text-slate-500 font-medium flex items-center gap-3">
                    <span className="font-mono">•••• {row.last4}</span>
                    <span>·</span>
                    <span className="uppercase tracking-widest text-[10px] font-black">{row.scope.replace('_', ' ')}</span>
                    <span>·</span>
                    <span>Rotated {new Date(row.rotated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
            </div>
            {row.last_test_at && (
                <div className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                    row.last_test_ok ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
                }`} title={row.last_test_error ?? ''}>
                    {row.last_test_ok ? 'Test OK' : 'Test failed'}
                </div>
            )}
            <button
                onClick={test}
                disabled={testing || busy}
                title="Test connection"
                className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center border border-slate-100 transition-colors disabled:opacity-50"
            >
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            </button>
            <button
                onClick={toggle}
                disabled={busy}
                title={row.is_active ? 'Disable' : 'Enable'}
                className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 flex items-center justify-center border border-slate-100 transition-colors disabled:opacity-50"
            >
                <Power className="h-3.5 w-3.5" />
            </button>
            <button
                onClick={remove}
                disabled={busy}
                title="Delete"
                className="h-8 w-8 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 flex items-center justify-center border border-slate-100 transition-colors disabled:opacity-50"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    );
}

function AddKeyModal({
    provider, onClose, onSaved,
}: { provider: string; onClose: () => void; onSaved: () => void }) {
    const [label, setLabel] = useState('Default');
    const [rawKey, setRawKey] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    const providerLabel = PROVIDERS.find(p => p.value === provider)?.label ?? provider;

    const save = async () => {
        setErr(null);
        if (!rawKey.trim()) { setErr('API key is required'); return; }
        setBusy(true);
        const res = await fetch('/api/admin/integrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, label, rawKey, scope: 'global' }),
        });
        if (!res.ok) {
            const j = await res.json().catch(() => ({}));
            setErr(j.error || `Save failed (${res.status})`);
            setBusy(false);
            return;
        }
        onSaved();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 backdrop-blur-md p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl max-w-md w-full p-8" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-1">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <KeyRound className="h-4 w-4" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900">Add {providerLabel} key</h2>
                </div>
                <p className="text-xs text-slate-500 mb-6">Stored encrypted. Only the last 4 characters will be visible after save.</p>

                {err && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-[13px] font-medium text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" /> {err}
                    </div>
                )}

                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">Label</label>
                <input
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    placeholder="e.g. Default, Backup, Dev"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 mb-4"
                />

                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5">API key</label>
                <textarea
                    value={rawKey}
                    onChange={e => setRawKey(e.target.value)}
                    placeholder="Paste the API key…"
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 font-mono mb-2"
                />
                <p className="text-[11px] text-slate-500 mb-6 flex items-center gap-1.5">
                    <EyeOff className="h-3 w-3" /> This is the only time you'll see the full key.
                </p>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={save}
                        disabled={busy}
                        className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-4 py-3 rounded-xl shadow-sm shadow-blue-600/20 transition-colors disabled:opacity-60"
                    >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                        Save key
                    </button>
                </div>
            </div>
        </div>
    );
}
