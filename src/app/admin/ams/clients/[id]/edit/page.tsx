'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    ArrowLeft, Building2, Users, DollarSign, Cloud,
    Loader2, CheckCircle2, AlertCircle, RefreshCw,
    Trash2, ShieldCheck, LogOut, User, Mail, Calendar, FileText
} from 'lucide-react';
import { getGdapTokenForTenant, signInAudcompAdmin, getCurrentAccount, signOutMsal } from '@/lib/msal';
import type { AccountInfo } from '@azure/msal-browser';

const AGREEMENT_TYPES = [
    'AMS - Essentials',
    'AMS - Monitoring Only',
    'AMS - Remote Support',
    'AMS - Remote w/Monthly Maintenance',
    'AMS - Remote/Onsite Support',
];

const BILLING_CYCLES = ['Monthly', 'Quarterly', 'Annual'];

export default function EditAMSClientPage() {
    const params = useParams();
    const clientId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [adminAccount, setAdminAccount] = useState<AccountInfo | null>(null);
    const [signingIn, setSigningIn] = useState(false);

    const [form, setForm] = useState({
        company_name: '',
        agreement_type: '',
        agreement_name: '',
        contact_name: '',
        contact_email: '',
        billing_cycle: 'Monthly',
        contract_start: '',
        contract_end: '',
        users_contracted: '',
        price_per_user: '',
        m365_tenant_id: '',
        notes: ''
    });

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function init() {
            const account = await getCurrentAccount();
            if (account) setAdminAccount(account);

            const { data, error } = await (supabase.from('ams_clients') as any)
                .select('*').eq('id', clientId).single();

            if (error || !data) { setError('Client not found.'); setLoading(false); return; }

            setForm({
                company_name: data.company_name || '',
                agreement_type: data.agreement_type || '',
                agreement_name: data.agreement_name || '',
                contact_name: data.contact_name || '',
                contact_email: data.contact_email || '',
                billing_cycle: data.billing_cycle || 'Monthly',
                contract_start: data.contract_start || '',
                contract_end: data.contract_end || '',
                users_contracted: String(data.users_contracted ?? ''),
                price_per_user: String(data.price_per_user ?? ''),
                m365_tenant_id: data.m365_tenant_id || '',
                notes: data.notes || ''
            });
            setLoading(false);
        }
        init();
    }, [clientId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const { error: updateError } = await (supabase.from('ams_clients') as any)
            .update({
                company_name: form.company_name,
                agreement_type: form.agreement_type || null,
                agreement_name: form.agreement_name || null,
                contact_name: form.contact_name || null,
                contact_email: form.contact_email || null,
                monthly_amount: (parseInt(form.users_contracted) || 0) * (parseFloat(form.price_per_user) || 0),
                billing_cycle: form.billing_cycle || 'Monthly',
                contract_start: form.contract_start || null,
                contract_end: form.contract_end || null,
                users_contracted: parseInt(form.users_contracted) || 0,
                price_per_user: parseFloat(form.price_per_user) || 0,
                m365_tenant_id: form.m365_tenant_id || null,
                notes: form.notes || null,
            })
            .eq('id', clientId);

        if (updateError) { setError(updateError.message); setSaving(false); return; }
        setSaved(true);
        setTimeout(() => router.push('/admin/ams/clients'), 1200);
    };

    const handleSignIn = async () => {
        setSigningIn(true);
        setError(null);
        try {
            const { account } = await signInAudcompAdmin();
            setAdminAccount(account);
        } catch (err: any) {
            if (!err.message?.includes('user_cancelled')) setError('Sign-in failed. Please try again.');
        } finally { setSigningIn(false); }
    };

    const handleDisconnect = async () => {
        try { await signOutMsal(); } catch { /* ignore */ }
        setAdminAccount(null);
        setSyncResult(null);
    };

    const handleSync = async () => {
        if (!form.m365_tenant_id) { setError("Enter this client's Microsoft Tenant ID first."); return; }
        setSyncing(true);
        setSyncResult(null);
        try {
            const accessToken = await getGdapTokenForTenant(form.m365_tenant_id, adminAccount);
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/ams/sync-m365', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId, accessToken, authToken: session?.access_token })
            });
            const result = await res.json();
            setSyncResult(result);
        } catch (err: any) {
            if (err.message?.includes('user_cancelled')) {
                setSyncResult({ error: 'Sign-in cancelled.' });
            } else {
                setSyncResult({ error: `GDAP sync failed: ${err.message || 'Verify AUDCOMP has GDAP access to this tenant.'}` });
            }
        } finally { setSyncing(false); }
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

                <header className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/ams/clients" className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{form.company_name || 'Edit Client'}</h1>
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
                        <form onSubmit={handleSubmit} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-8">

                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-2xl p-4 text-red-700 font-bold text-sm">
                                    <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                                </div>
                            )}

                            {/* Company Info */}
                            <div className="space-y-4">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-600" /> Company Info
                                </h2>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Company Name *</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input name="company_name" type="text" required value={form.company_name} onChange={handleChange}
                                            placeholder="Acme Corp"
                                            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Agreement Type</label>
                                        <select name="agreement_type" value={form.agreement_type} onChange={handleChange}
                                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all">
                                            <option value="">Select type...</option>
                                            {AGREEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Agreement Name</label>
                                        <input name="agreement_name" type="text" value={form.agreement_name} onChange={handleChange}
                                            placeholder="Audcomp Managed Services - Silver"
                                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                    </div>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="space-y-4">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-600" /> Primary Contact
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input name="contact_name" type="text" value={form.contact_name} onChange={handleChange}
                                                placeholder="Jane Smith"
                                                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Contact Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input name="contact_email" type="email" value={form.contact_email} onChange={handleChange}
                                                placeholder="jane@acme.com"
                                                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Billing */}
                            <div className="space-y-4">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-blue-600" /> Billing & Contract
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Monthly Amount</label>
                                        <div className="flex items-center gap-2 px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-100 text-slate-500 text-sm font-bold">
                                            <DollarSign className="h-4 w-4 text-slate-400 shrink-0" />
                                            {(() => {
                                                const u = parseInt(form.users_contracted) || 0;
                                                const p = parseFloat(form.price_per_user) || 0;
                                                const total = u * p;
                                                return total > 0
                                                    ? <span className="text-slate-900 font-black">${total.toLocaleString('en-CA', { minimumFractionDigits: 2 })} <span className="text-slate-400 font-medium text-xs">({u} × ${p.toFixed(2)})</span></span>
                                                    : <span className="text-slate-400 font-medium">Enter users & rate below</span>;
                                            })()}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Billing Cycle</label>
                                        <select name="billing_cycle" value={form.billing_cycle} onChange={handleChange}
                                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all">
                                            {BILLING_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Contract Start</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input name="contract_start" type="date" value={form.contract_start} onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Contract End</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input name="contract_end" type="date" value={form.contract_end} onChange={handleChange}
                                                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* User Counts */}
                            <div className="space-y-4">
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Users className="h-4 w-4 text-blue-600" /> User Counts <span className="text-slate-300 font-medium normal-case">(optional)</span>
                                </h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Contracted Users</label>
                                        <div className="relative">
                                            <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input name="users_contracted" type="number" value={form.users_contracted} onChange={handleChange}
                                                placeholder="50"
                                                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Price Per User ($/mo)</label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                            <input name="price_per_user" type="number" step="0.01" value={form.price_per_user} onChange={handleChange}
                                                placeholder="12.50"
                                                className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <FileText className="h-3.5 w-3.5" /> Notes
                                </label>
                                <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                                    placeholder="Any additional notes..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm resize-none" />
                            </div>

                            <button type="submit" disabled={saving || saved}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'} disabled:opacity-50`}>
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                    saved ? <><CheckCircle2 className="h-5 w-5" /> Saved!</> : 'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* GDAP Sync Panel */}
                    <div className="col-span-12 lg:col-span-5">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2">
                                <Cloud className="h-5 w-5 text-blue-600" /> M365 License Sync
                            </h2>
                            <p className="text-sm text-slate-400 font-medium mb-6">
                                Uses AUDCOMP's GDAP access. Sign in once as the AUDCOMP admin — no client involvement required.
                            </p>

                            {/* Tenant ID field */}
                            <div className="space-y-1.5 mb-5">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Client's Tenant ID</label>
                                <div className="relative">
                                    <Cloud className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input name="m365_tenant_id" type="text"
                                        value={form.m365_tenant_id} onChange={handleChange}
                                        placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                        className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-blue-100 bg-blue-50/30 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all font-mono text-sm"
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold pl-1">From Partner Center → Customers → {form.company_name || 'this client'}</p>
                            </div>

                            {/* Admin session */}
                            {adminAccount ? (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-emerald-800">GDAP Admin Signed In</p>
                                            <p className="text-xs font-medium text-emerald-600 truncate">{adminAccount.username}</p>
                                        </div>
                                        <button onClick={handleDisconnect} className="ml-auto text-slate-400 hover:text-red-500 transition-colors">
                                            <LogOut className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <button onClick={handleSync} disabled={syncing || !form.m365_tenant_id}
                                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm transition-all ${!form.m365_tenant_id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}>
                                        <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                        {syncing ? 'Syncing via GDAP...' : !form.m365_tenant_id ? 'Enter Tenant ID above' : 'Sync License Count'}
                                    </button>
                                </div>
                            ) : (
                                <button onClick={handleSignIn} disabled={signingIn}
                                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-sm border-2 border-slate-200 hover:border-blue-400 bg-white hover:bg-blue-50/50 text-slate-700 transition-all">
                                    {signingIn ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" /> :
                                        <svg className="h-5 w-5" viewBox="0 0 23 23" fill="none">
                                            <rect x="1" y="1" width="10" height="10" fill="#F35325" />
                                            <rect x="12" y="1" width="10" height="10" fill="#81BC06" />
                                            <rect x="1" y="12" width="10" height="10" fill="#05A6F0" />
                                            <rect x="12" y="12" width="10" height="10" fill="#FFBA08" />
                                        </svg>}
                                    {signingIn ? 'Opening Microsoft sign-in...' : 'Sign in as AUDCOMP Admin'}
                                </button>
                            )}

                            {syncResult && (
                                <div className={`mt-4 p-4 rounded-2xl border text-sm font-bold ${syncResult.error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    {syncResult.error ? (
                                        <div className="flex items-start gap-2"><AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {syncResult.error}</div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="h-4 w-4" /> {syncResult.totalLicensedUsers} AMS users found</div>
                                            {syncResult.licenseBreakdown && Object.entries(syncResult.licenseBreakdown).map(([sku, count]) => (
                                                <div key={sku} className="flex justify-between text-xs font-bold text-emerald-600 py-0.5 border-t border-emerald-100/50">
                                                    <span>{sku}</span><span>{count as number}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">GDAP Flow</p>
                                {[
                                    'Sign in once as AUDCOMP admin (works for all clients)',
                                    "Enter the client's Tenant ID from Partner Center",
                                    'Click Sync — GDAP handles cross-tenant access',
                                    "No changes to client's tenant. No client involvement.",
                                ].map((s, i) => (
                                    <div key={i} className="flex items-start gap-2 py-1">
                                        <span className="h-4 w-4 rounded-full bg-blue-100 text-blue-600 text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                                        <span className="text-xs text-slate-500 font-medium">{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
