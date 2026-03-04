'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    ArrowLeft, Building2, Users, DollarSign, Cloud,
    Loader2, CheckCircle2, AlertCircle, RefreshCw,
    Trash2, LogIn, LogOut, ShieldCheck
} from 'lucide-react';
import { signInWithM365, signOutM365, acquireM365Token } from '@/lib/msal';

export default function EditAMSClientPage() {
    const params = useParams();
    const clientId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // M365 session state
    const [m365Account, setM365Account] = useState<any>(null);
    const [m365Token, setM365Token] = useState<string | null>(null);
    const [m365Connecting, setM365Connecting] = useState(false);

    const [form, setForm] = useState({
        company_name: '',
        users_contracted: '',
        price_per_user: '',
        notes: ''
    });

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchClient() {
            const { data, error } = await (supabase.from('ams_clients') as any)
                .select('*')
                .eq('id', clientId)
                .single();

            if (error || !data) {
                setError('Client not found.');
                setLoading(false);
                return;
            }

            setForm({
                company_name: data.company_name || '',
                users_contracted: String(data.users_contracted ?? ''),
                price_per_user: String(data.price_per_user ?? ''),
                notes: data.notes || ''
            });
            setLoading(false);
        }
        fetchClient();
    }, [clientId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const { error: updateError } = await (supabase.from('ams_clients') as any)
            .update({
                company_name: form.company_name,
                users_contracted: parseInt(form.users_contracted) || 0,
                price_per_user: parseFloat(form.price_per_user) || 0,
                notes: form.notes || null,
                updated_at: new Date().toISOString()
            })
            .eq('id', clientId);

        if (updateError) {
            setError(updateError.message);
            setSaving(false);
            return;
        }

        setSaved(true);
        setTimeout(() => router.push('/admin/ams/clients'), 1200);
    };

    const handleConnectM365 = async () => {
        setM365Connecting(true);
        setError(null);
        try {
            const { accessToken, account } = await signInWithM365();
            setM365Token(accessToken);
            setM365Account(account);
        } catch (err: any) {
            if (!err.message?.includes('user_cancelled')) {
                setError('Microsoft sign-in failed. Please try again.');
            }
        } finally {
            setM365Connecting(false);
        }
    };

    const handleDisconnectM365 = async () => {
        try {
            await signOutM365();
        } catch { /* ignore */ }
        setM365Token(null);
        setM365Account(null);
        setSyncResult(null);
    };

    const handleSync = async () => {
        if (!m365Token) {
            setError('Please connect Microsoft 365 first.');
            return;
        }
        setSyncing(true);
        setSyncResult(null);
        try {
            // Try to get a fresh token silently first
            let token = m365Token;
            try { token = (await acquireM365Token()) || m365Token; } catch { /* use existing */ }

            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/ams/sync-m365', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    accessToken: token,
                    authToken: session?.access_token,
                })
            });
            const result = await res.json();
            setSyncResult(result);
            if (result.success) setM365Token(token); // refresh stored token
        } catch {
            setSyncResult({ error: 'Sync failed. Please reconnect Microsoft 365.' });
        } finally {
            setSyncing(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this client permanently? This cannot be undone.')) return;
        await (supabase.from('ams_clients') as any).delete().eq('id', clientId);
        router.push('/admin/ams/clients');
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
                <header className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/ams/clients" className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                                {form.company_name || 'Edit Client'}
                            </h1>
                            <p className="text-slate-400 font-medium text-sm mt-0.5">AMS Client Profile</p>
                        </div>
                    </div>
                    <button onClick={handleDelete}
                        className="flex items-center gap-2 text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 rounded-2xl px-4 py-2.5 text-sm font-black bg-white transition-all">
                        <Trash2 className="h-4 w-4" /> Delete Client
                    </button>
                </header>

                <div className="grid grid-cols-12 gap-8">
                    {/* Edit Form */}
                    <div className="col-span-12 lg:col-span-7">
                        <form onSubmit={handleSubmit} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" /> Client Details
                            </h2>

                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 font-bold text-sm">
                                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                                </div>
                            )}

                            {[
                                { label: 'Company Name', name: 'company_name', type: 'text', placeholder: 'Acme Corp', icon: Building2, required: true },
                                { label: 'Contracted Users', name: 'users_contracted', type: 'number', placeholder: '50', icon: Users, required: true },
                                { label: 'Price Per User ($/mo)', name: 'price_per_user', type: 'number', placeholder: '12.50', icon: DollarSign, required: true },
                            ].map(({ label, name, type, placeholder, icon: Icon, required }) => (
                                <div key={name} className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</label>
                                    <div className="relative">
                                        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            name={name} type={type} required={required}
                                            value={(form as any)[name]} onChange={handleChange}
                                            placeholder={placeholder}
                                            step={name === 'price_per_user' ? '0.01' : '1'}
                                            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        />
                                    </div>
                                </div>
                            ))}

                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Notes</label>
                                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                                    placeholder="Any additional notes..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm resize-none"
                                />
                            </div>

                            <button type="submit" disabled={saving || saved}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'} disabled:opacity-50`}>
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                    saved ? <><CheckCircle2 className="h-5 w-5" /> Saved!</> : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* M365 Connection Panel */}
                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2">
                                <Cloud className="h-5 w-5 text-blue-600" /> Microsoft 365 Sync
                            </h2>
                            <p className="text-sm text-slate-400 font-medium mb-6">
                                Sign in with the client's Global Admin account to pull their licensed user count.
                            </p>

                            {!m365Account ? (
                                // Not connected
                                <button onClick={handleConnectM365} disabled={m365Connecting}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm border-2 border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-700 transition-all disabled:opacity-50">
                                    {m365Connecting ? (
                                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                    ) : (
                                        <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
                                            <rect x="1" y="1" width="10" height="10" fill="#F35325" />
                                            <rect x="12" y="1" width="10" height="10" fill="#81BC06" />
                                            <rect x="1" y="12" width="10" height="10" fill="#05A6F0" />
                                            <rect x="12" y="12" width="10" height="10" fill="#FFBA08" />
                                        </svg>
                                    )}
                                    {m365Connecting ? 'Opening Microsoft sign-in...' : 'Connect Microsoft 365'}
                                </button>
                            ) : (
                                // Connected
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-emerald-800">Connected</p>
                                            <p className="text-xs font-medium text-emerald-600 truncate">{m365Account.username}</p>
                                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">{m365Account.tenantId}</p>
                                        </div>
                                    </div>

                                    <button onClick={handleSync} disabled={syncing}
                                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50">
                                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                        {syncing ? 'Syncing...' : 'Sync License Counts Now'}
                                    </button>

                                    <button onClick={handleDisconnectM365}
                                        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-xs text-slate-400 hover:text-red-500 transition-colors border border-slate-100 hover:border-red-100">
                                        <LogOut className="h-3.5 w-3.5" /> Disconnect Account
                                    </button>
                                </div>
                            )}

                            {/* Sync Result */}
                            {syncResult && (
                                <div className={`mt-4 p-4 rounded-2xl border text-sm font-bold ${syncResult.error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    {syncResult.error ? (
                                        <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {syncResult.error}</div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3">
                                                <CheckCircle2 className="h-4 w-4" />
                                                <span>{syncResult.totalLicensedUsers} AMS licensed users found</span>
                                            </div>
                                            {syncResult.licenseBreakdown && Object.entries(syncResult.licenseBreakdown).map(([sku, count]) => (
                                                <div key={sku} className="flex justify-between text-xs font-bold text-emerald-600 py-0.5 border-t border-emerald-100/50">
                                                    <span>{sku}</span>
                                                    <span>{count as number}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Info box */}
                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">How it works</p>
                                <div className="space-y-1.5">
                                    {[
                                        'Click Connect and sign in with the client\'s Global Admin account',
                                        'A one-time consent screen will appear — click Accept',
                                        'Click Sync to pull F1, F3, Business, E3, E5 license counts',
                                        'No changes are made to the client\'s tenant',
                                    ].map((step, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="h-4 w-4 rounded-full bg-blue-100 text-blue-600 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                            <span className="text-xs text-slate-500 font-medium">{step}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
