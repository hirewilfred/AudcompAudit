'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    Building2, DollarSign, Cloud, Loader2, ArrowLeft,
    CheckCircle2, AlertTriangle, TrendingDown, Users, Calendar,
    RefreshCw, Link as LinkIcon, Edit2, ShieldAlert
} from 'lucide-react';

export default function ClientDetailPage() {
    const { id } = useParams() as { id: string };
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<any>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState<{ success?: boolean; error?: string } | null>(null);

    // Messages from OAuth redirect
    const m365Connected = searchParams.get('m365_connected');
    const m365Error = searchParams.get('m365_error');

    const fetchClient = async () => {
        const { data, error } = await (supabase
            .from('ams_clients') as any)
            .select(`*, ams_user_snapshots(total_licensed_users, basic_licensed_users, premium_licensed_users, license_breakdown, snapshot_date)`)
            .eq('id', id)
            .order('snapshot_date', { referencedTable: 'ams_user_snapshots', ascending: false })
            .single();

        if (error) {
            console.error("Supabase error fetching client:", error);
            setFetchError(error.message);
        }

        setClient(data);
        setLoading(false);
    };

    useEffect(() => {
        if (id) fetchClient();
    }, [id]);

    const handleConnectM365 = () => {
        // Redirect to our Connect API route which redirects to Microsoft
        window.location.href = `/api/ams/m365-connect/${id}`;
    };

    const handleDisconnectM365 = async () => {
        if (!confirm('Are you sure you want to disconnect this Microsoft 365 account? You will need their global admin to log in again to reconnect.')) return;
        
        await (supabase.from('ams_clients') as any).update({
            m365_connected: false,
            m365_access_token: null,
            m365_refresh_token: null,
            m365_token_expires_at: null,
        }).eq('id', id);
        
        fetchClient();
    };

    const handleSync = async () => {
        setSyncing(true);
        setSyncResult(null);

        try {
            const res = await fetch('/api/ams/sync-m365', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientId: id })
            });

            const json = await res.json();
            
            if (res.ok) {
                setSyncResult({ success: true });
                await fetchClient(); // Refresh snapshot data
            } else {
                setSyncResult({ error: json.error || 'Failed to sync. Microsoft token may have expired.' });
                await fetchClient(); // Refresh connected status in case it was set to false
            }
        } catch (err: any) {
            setSyncResult({ error: err.message || 'Server error during sync.' });
        } finally {
            setSyncing(false);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
    );

    if (!client) return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <h1 className="text-2xl font-black text-slate-800 mb-2">Client Not Found</h1>
            {fetchError && (
                <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl max-w-lg mb-4 text-sm font-medium">
                    <p className="font-bold mb-1">Database Error:</p>
                    <code className="text-xs bg-red-100 p-1 rounded">{fetchError}</code>
                    {fetchError.includes('basic_licensed_users') && (
                        <p className="mt-3 text-xs bg-white/50 p-2 rounded border border-red-100/50 text-left">
                            <strong>Note:</strong> It looks like the M365 migration script hasn't been run on your Supabase database yet. Please run the SQL from the <b>add_m365_columns.sql</b> file in your Supabase SQL editor to add the missing columns.
                        </p>
                    )}
                </div>
            )}
            <Link href="/admin/ams/clients" className="mt-4 text-blue-600 font-bold hover:underline">Return to Clients</Link>
        </div>
    );

    const snap = client.ams_user_snapshots?.[0];
    const actual = snap?.total_licensed_users ?? null;
    const basic = snap?.basic_licensed_users ?? null;
    const premium = snap?.premium_licensed_users ?? null;
    const contracted = client.users_contracted || 0;
    const monthly = parseFloat(client.monthly_amount) || 0;
    const ppu = parseFloat(client.price_per_user) || 0;
    
    const isOver = actual !== null && contracted > 0 && actual > contracted;
    const isUnder = actual !== null && contracted > 0 && actual < contracted;
    const delta = actual !== null ? actual - contracted : null;

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />
            <main className="pl-64 pr-10 pt-10 pb-20">
                
                {/* Status Banners */}
                {m365Connected && (
                    <div className="mb-6 flex gap-3 px-5 py-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        <p>Microsoft 365 successfully connected. You can now sync licensing data anytime.</p>
                    </div>
                )}
                
                {m365Error && (
                    <div className="mb-6 flex gap-3 px-5 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-bold text-sm">
                        <ShieldAlert className="h-5 w-5 shrink-0" />
                        <p>{m365Error}</p>
                    </div>
                )}

                {/* Header */}
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/ams/clients" className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{client.company_name}</h1>
                            <p className="text-slate-400 font-medium text-sm mt-0.5">{client.agreement_type || 'No Agreement Type'} · {client.contact_name || 'No Contact'}</p>
                        </div>
                    </div>
                    <Link href={`/admin/ams/clients/${id}/edit`} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 shadow-sm transition-all">
                        <Edit2 className="h-4 w-4" /> Edit Client
                    </Link>
                </header>

                <div className="grid grid-cols-12 gap-6">
                    
                    {/* Left Col - Client Info */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        {/* Info Card */}
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6 overflow-hidden relative">
                            <Building2 className="absolute -bottom-6 -right-6 h-32 w-32 text-slate-50/50" />
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Contract Details</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 mb-1">Contract Value</p>
                                        <div className="flex items-baseline gap-2">
                                            <p className="text-2xl font-black text-slate-900">${monthly.toLocaleString('en-CA', { minimumFractionDigits: 2 })}</p>
                                            <p className="text-xs font-bold text-slate-400">/ {client.billing_cycle?.toLowerCase() || 'mo'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 mb-1">Contracted Seats</p>
                                            <p className="font-bold text-slate-700">{contracted}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400 mb-1">Price / Seat</p>
                                            <p className="font-bold text-slate-700">${ppu.toFixed(2)}</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-50">
                                        <p className="text-xs font-bold text-slate-400 mb-1">Status</p>
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-black uppercase">
                                            {client.status || 'Active'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* M365 Connection Card */}
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                    <Cloud className="h-3.5 w-3.5 text-blue-500" /> Connection Context
                                </h3>
                                {client.m365_connected && (
                                    <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                                        Connected
                                    </span>
                                )}
                            </div>

                            {/* Tenant ID — always visible so it can be verified */}
                            {client.m365_tenant_id && (
                                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <span className="text-xs text-slate-400 font-bold shrink-0">Tenant ID:</span>
                                    <code className="text-xs font-mono text-slate-600 select-all truncate">
                                        {client.m365_tenant_id}
                                    </code>
                                </div>
                            )}

                            {client.m365_connected ? (
                                <div>
                                    <p className="text-sm text-slate-600 font-medium mb-4">
                                        Microsoft 365 is connected. The background token is managed safely and allows for on-demand syncing without requiring sign-ins.
                                    </p>
                                    <div className="text-xs text-slate-400 font-medium mb-6">
                                        Connected on: {client.m365_connected_at ? new Date(client.m365_connected_at).toLocaleString() : 'Unknown'}
                                    </div>
                                    <button onClick={handleDisconnectM365}
                                        className="w-full text-center text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                                        Disconnect M365 Account
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <p className="text-sm text-slate-600 font-medium mb-6">
                                        Connect to Microsoft 365 to automatically track Office licenses.
                                        You only need to do this once. Click below, and sign in with the client's <span className="text-slate-900 font-bold">Global Admin</span> account.
                                    </p>
                                    <button onClick={handleConnectM365}
                                        className="w-full py-3.5 rounded-xl bg-[#0078D4] text-white font-black text-sm hover:bg-[#006CBE] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0078D4]/20">
                                        <LinkIcon className="h-4 w-4" /> Connect Office 365
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Col - Sync Data */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-blue-600" /> License Synchronization
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium mt-1">
                                        {client.m365_last_synced_at 
                                            ? `Last sync: ${new Date(client.m365_last_synced_at).toLocaleString()}` 
                                            : 'Never synced'}
                                    </p>
                                </div>

                                <button onClick={handleSync} disabled={syncing || !client.m365_connected}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all
                                        ${client.m365_connected 
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20' 
                                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                                    <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                    {syncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                            </div>

                            {syncResult?.error && (
                                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm font-bold flex gap-2">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    {syncResult.error}
                                </div>
                            )}
                            {syncResult?.success && (
                                <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-bold flex gap-2 overflow-hidden transition-all duration-500 animate-in fade-in slide-in-from-top-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    Successfully synced licensing data from Microsoft 365.
                                </div>
                            )}

                            {!snap ? (
                                <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    <Cloud className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                    <p className="text-slate-400 font-bold">No data available yet.</p>
                                    <p className="text-slate-400 text-xs font-medium mt-1">
                                        {client.m365_connected ? 'Click Sync Now to pull current data.' : 'Please connect M365 first.'}
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Contracted Baseline</p>
                                            <p className="text-3xl font-black text-slate-800 tabular-nums">{contracted}</p>
                                        </div>
                                        <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Basic Licenses</p>
                                            <p className="text-3xl font-black text-blue-600 tabular-nums">{basic !== null ? basic : '—'}</p>
                                            <p className="text-[9px] text-slate-400 font-medium mt-1">F1, F3, Basic, Standard, E1</p>
                                        </div>
                                        <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Premium Licenses</p>
                                            <p className="text-3xl font-black text-indigo-600 tabular-nums">{premium !== null ? premium : '—'}</p>
                                            <p className="text-[9px] text-indigo-400 font-medium mt-1">Premium, E3, E5</p>
                                        </div>
                                        <div className={`p-5 rounded-2xl border relative overflow-hidden ${delta !== null && delta > 0 ? 'bg-red-50 border-red-100' : delta !== null && delta < 0 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 z-10 relative">Delta (Needs Billing)</p>
                                            <p className={`text-3xl font-black tabular-nums z-10 relative
                                                ${delta !== null && delta > 0 ? 'text-red-600' : delta !== null && delta < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {delta !== null && delta > 0 ? `+${delta}` : delta}
                                            </p>
                                            {delta !== null && delta > 0 && <TrendingDown className="absolute right-4 top-1/2 -translate-y-1/2 h-16 w-16 text-red-100 opacity-50 z-0" />}
                                            {delta === 0 && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 h-16 w-16 text-emerald-100 opacity-50 z-0" />}
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-black text-slate-900 mb-4">Detailed Breakdown</h3>
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                                <tr>
                                                    <th className="py-3 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">License SKU</th>
                                                    <th className="py-3 px-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned Seats</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {Object.entries(snap.license_breakdown || {}).length > 0 ? (
                                                    Object.entries(snap.license_breakdown || {}).map(([sku, count]) => (
                                                        <tr key={sku} className="hover:bg-slate-50/50">
                                                            <td className="py-3 px-4 font-bold text-slate-700">{sku}</td>
                                                            <td className="py-3 px-4 font-black text-slate-900 text-right tabular-nums">{count as React.ReactNode}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan={2} className="py-8 text-center text-slate-400 font-medium text-xs">No licenses active for this client.</td>
                                                    </tr>
                                                )}
                                                <tr className="bg-slate-50">
                                                    <td className="py-3 px-4 font-black text-slate-800 text-right uppercase tracking-widest text-[10px]">Total Combined Access</td>
                                                    <td className="py-3 px-4 font-black text-blue-600 text-right tabular-nums text-lg">{actual}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
