'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    ArrowLeft, Building2, Users, DollarSign, Cloud,
    Loader2, CheckCircle2, AlertCircle, RefreshCw, Trash2
} from 'lucide-react';

export default function EditAMSClientPage() {
    const params = useParams();
    const clientId = params.id as string;
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        company_name: '',
        users_contracted: '',
        price_per_user: '',
        m365_tenant_id: '',
        m365_client_id: '',
        m365_client_secret: '',
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
                m365_tenant_id: data.m365_tenant_id || '',
                m365_client_id: data.m365_client_id || '',
                m365_client_secret: data.m365_client_secret || '',
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
                m365_tenant_id: form.m365_tenant_id || null,
                m365_client_id: form.m365_client_id || null,
                m365_client_secret: form.m365_client_secret || null,
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

    const handleSync = async () => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/ams/sync-m365', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientId,
                    tenantId: form.m365_tenant_id,
                    m365ClientId: form.m365_client_id,
                    m365ClientSecret: form.m365_client_secret,
                    authToken: session?.access_token,
                })
            });
            const result = await res.json();
            setSyncResult(result);
        } catch {
            setSyncResult({ error: 'Sync failed. Check M365 credentials.' });
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
                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-2 text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 rounded-2xl px-4 py-2.5 text-sm font-black bg-white transition-all"
                    >
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
                                            name={name}
                                            type={type}
                                            required={required}
                                            value={(form as any)[name]}
                                            onChange={handleChange}
                                            placeholder={placeholder}
                                            step={type === 'number' && name === 'price_per_user' ? '0.01' : '1'}
                                            className="w-full pl-10 pr-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                                        />
                                    </div>
                                </div>
                            ))}

                            {/* M365 Credentials */}
                            <div className="pt-2">
                                <h3 className="text-sm font-black text-slate-700 flex items-center gap-2 mb-4">
                                    <Cloud className="h-4 w-4 text-blue-500" /> Microsoft 365 Connection <span className="text-slate-300 font-medium">(optional)</span>
                                </h3>
                                <div className="space-y-4 bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                                    {[
                                        { label: 'Tenant ID', name: 'm365_tenant_id', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
                                        { label: 'Client ID', name: 'm365_client_id', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
                                        { label: 'Client Secret', name: 'm365_client_secret', placeholder: '••••••••••••' },
                                    ].map(({ label, name, placeholder }) => (
                                        <div key={name} className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</label>
                                            <input
                                                name={name}
                                                type={name === 'm365_client_secret' ? 'password' : 'text'}
                                                value={(form as any)[name]}
                                                onChange={handleChange}
                                                placeholder={placeholder}
                                                className="w-full px-4 py-3 rounded-xl border border-blue-100 bg-white font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Notes</label>
                                <textarea
                                    name="notes"
                                    value={form.notes}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Any additional notes..."
                                    className="w-full px-4 py-3 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-sm resize-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={saving || saved}
                                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${saved ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'} disabled:opacity-50`}
                            >
                                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> :
                                    saved ? <><CheckCircle2 className="h-5 w-5" /> Saved!</> :
                                        'Save Changes'}
                            </button>
                        </form>
                    </div>

                    {/* M365 Sync Panel */}
                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2">
                                <Cloud className="h-5 w-5 text-blue-600" /> M365 Sync
                            </h2>
                            <p className="text-sm text-slate-400 font-medium mb-6">Pull the latest licensed user count from this client's Microsoft 365 tenant.</p>

                            <button
                                onClick={handleSync}
                                disabled={syncing || !form.m365_tenant_id}
                                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${!form.m365_tenant_id ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
                            >
                                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Syncing...' : !form.m365_tenant_id ? 'Enter M365 credentials first' : 'Sync Now'}
                            </button>

                            {syncResult && (
                                <div className={`mt-4 p-4 rounded-2xl border text-sm font-bold ${syncResult.error ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
                                    {syncResult.error ? (
                                        <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> {syncResult.error}</div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center gap-2 mb-3"><CheckCircle2 className="h-4 w-4" /> {syncResult.totalLicensedUsers} AMS users found</div>
                                            {syncResult.licenseBreakdown && Object.entries(syncResult.licenseBreakdown).map(([sku, count]) => (
                                                <div key={sku} className="flex justify-between text-xs font-bold text-emerald-600 py-0.5">
                                                    <span>{sku}</span>
                                                    <span>{count as number}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
