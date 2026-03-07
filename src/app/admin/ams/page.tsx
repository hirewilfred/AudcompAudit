'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    Building2, DollarSign, AlertTriangle, Users,
    RefreshCw, Plus, Loader2, ArrowRight, CheckCircle2, ShieldCheck,
    TrendingUp, TrendingDown, Minus, ChevronUp, ChevronDown
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AMSDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [syncing, setSyncing] = useState(false);
    const [syncProgress, setSyncProgress] = useState('');
    const [syncResult, setSyncResult] = useState<{ synced: number; errors: string[] } | null>(null);
    const [sortCol, setSortCol] = useState<string>('company_name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/auth'); return; }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single() as any;

            if (!profileData?.is_admin) { router.push('/admin'); return; }

            if (!profileData?.is_admin) { router.push('/admin'); return; }

            const { data } = await supabase
                .from('ams_clients')
                .select(`*, ams_user_snapshots(total_licensed_users, basic_licensed_users, license_breakdown, snapshot_date, synced_at)`)
                .order('company_name') as any;

            setClients(data || []);
            setLoading(false);
        }
        load();
    }, []);

    // ── Derived Metrics ──────────────────────────
    const now = new Date();
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const totalMRR = clients.reduce((sum, c) => sum + (parseFloat(c.monthly_amount) || 0), 0);
    const totalContractedSeats = clients.reduce((sum, c) => sum + (c.users_contracted || 0), 0);
    const expiringSoon = clients.filter(c => {
        if (!c.contract_end) return false;
        const end = new Date(c.contract_end);
        return end >= now && end <= in90Days;
    }).length;

    // Clients where actual M365 users differ from contracted (synced clients only)
    const syncedClients = clients.filter(c => c.ams_user_snapshots?.[0] != null);
    const overContract = syncedClients.filter(c => {
        const actual = c.ams_user_snapshots[0].total_licensed_users;
        return actual > (c.users_contracted || 0);
    }).length;

    const handleSort = (col: string) => {
        if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
    };

    const sortedClients = [...clients].sort((a, b) => {
        let av: any, bv: any;
        switch (sortCol) {
            case 'company_name': av = a.company_name || ''; bv = b.company_name || ''; break;
            case 'agreement_type': av = a.agreement_type || ''; bv = b.agreement_type || ''; break;
            case 'contact_name': av = a.contact_name || ''; bv = b.contact_name || ''; break;
            case 'monthly_amount': av = parseFloat(a.monthly_amount) || 0; bv = parseFloat(b.monthly_amount) || 0; break;
            case 'users_contracted': av = a.users_contracted || 0; bv = b.users_contracted || 0; break;
            case 'price_per_user': av = parseFloat(a.price_per_user) || 0; bv = parseFloat(b.price_per_user) || 0; break;
            case 'contract_end': av = a.contract_end || ''; bv = b.contract_end || ''; break;
            default: av = ''; bv = '';
        }
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSyncAll = async () => {
        setSyncing(true);
        setSyncResult(null);
        
        const connectedClients = clients.filter(c => c.m365_connected);

        if (connectedClients.length === 0) {
            setSyncResult({ synced: 0, errors: ['No clients have connected their Microsoft 365 accounts yet.'] });
            setSyncing(false);
            return;
        }

        let synced = 0;
        const errors: string[] = [];

        for (let i = 0; i < connectedClients.length; i++) {
            const client = connectedClients[i];
            setSyncProgress(`Syncing ${i + 1}/${connectedClients.length}: ${client.company_name}`);
            try {
                const res = await fetch('/api/ams/sync-m365', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId: client.id })
                });
                const json = await res.json();
                if (res.ok) {
                    synced++;
                } else {
                    errors.push(`${client.company_name}: ${json.error || 'Unknown error'}`);
                }
            } catch (err: any) {
                errors.push(`${client.company_name}: ${err.message || 'Failed'}`);
            }
        }

        setSyncProgress('');
        setSyncResult({ synced, errors });
        const { data } = await supabase
            .from('ams_clients')
            .select(`*, ams_user_snapshots(total_licensed_users, basic_licensed_users, license_breakdown, snapshot_date, synced_at)`)
            .order('company_name') as any;
        setClients(data || []);
        setSyncing(false);
    };

    const lastUpdated = new Date().toLocaleTimeString();

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
    );

    // Sync result banner
    const SyncBanner = syncResult && (
        <div className={`mb-6 flex items-start gap-3 px-5 py-4 rounded-2xl border text-sm font-bold ${syncResult.errors.length === 0
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
            : syncResult.synced > 0
                ? 'bg-amber-50 border-amber-100 text-amber-700'
                : 'bg-red-50 border-red-100 text-red-700'
            }`}>
            <div className="flex-1">
                {syncResult.synced > 0 && <p>✓ Synced {syncResult.synced} client{syncResult.synced !== 1 ? 's' : ''} successfully.</p>}
                {syncResult.errors.map((e, i) => <p key={i} className="mt-1 font-medium">⚠ {e}</p>)}
            </div>
            <button onClick={() => setSyncResult(null)} className="opacity-50 hover:opacity-100 text-lg leading-none">×</button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />
            <main className="pl-64 pr-10 pt-10 pb-20">
                {SyncBanner}

                {/* Header */}
                <header className="flex items-end justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                            <CheckCircle2 className="h-3 w-3" /> AMS Portal Active
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">AMS Dashboard</h1>
                        <p className="text-slate-400 font-medium mt-2 text-sm">Annual Managed Services — Client Overview</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={handleSyncAll} disabled={syncing || clients.filter(c => c.m365_connected).length === 0}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-40">
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? (syncProgress || 'Syncing...') : 'Sync All M365'}
                        </button>
                        <Link href="/admin/ams/clients/new"
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20">
                            <Plus className="h-4 w-4" /> Add Client
                        </Link>
                    </div>
                </header>

                {/* Financial Overview Card */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Revenue Summary</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Last updated: {lastUpdated}</p>
                        </div>
                        <button
                            onClick={handleSyncAll}
                            disabled={syncing}
                            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-blue-700 transition-all"
                        >
                            <RefreshCw className={`h-3 w-3 ${syncing ? 'animate-spin' : ''}`} />
                            Update Dashboard
                        </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total MRR */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden"
                        >
                            <DollarSign className="absolute top-3 right-3 h-10 w-10 text-slate-100" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total MRR</p>
                            <p className="text-4xl font-black text-slate-900 tabular-nums">
                                ${totalMRR.toLocaleString('en-CA', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">{clients.length} clients</p>
                        </motion.div>

                        {/* Total Contracted Seats */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden"
                        >
                            <Users className="absolute top-3 right-3 h-10 w-10 text-slate-100" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contracted Seats</p>
                            <p className="text-4xl font-black text-slate-900 tabular-nums">{totalContractedSeats.toLocaleString()}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">
                                {totalContractedSeats > 0
                                    ? `$${(totalMRR / totalContractedSeats).toFixed(2)} avg/seat`
                                    : 'No seat data yet'}
                            </p>
                        </motion.div>

                        {/* Over Contract */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className={`rounded-2xl p-5 border relative overflow-hidden ${overContract > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}
                        >
                            <TrendingUp className={`absolute top-3 right-3 h-10 w-10 ${overContract > 0 ? 'text-red-100' : 'text-slate-100'}`} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Over Contract</p>
                            <p className={`text-4xl font-black tabular-nums ${overContract > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overContract}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">
                                {syncedClients.length > 0 ? `of ${syncedClients.length} synced clients` : 'No M365 data synced yet'}
                            </p>
                        </motion.div>

                        {/* Expiring Soon */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className={`rounded-2xl p-5 border relative overflow-hidden ${expiringSoon > 0 ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}
                        >
                            <AlertTriangle className={`absolute top-3 right-3 h-10 w-10 ${expiringSoon > 0 ? 'text-amber-100' : 'text-slate-100'}`} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Expiring Soon</p>
                            <p className={`text-4xl font-black tabular-nums ${expiringSoon > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{expiringSoon}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Contracts ending within 90 days</p>
                        </motion.div>
                    </div>
                </div>

                {/* Client Table */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-900">Contract Reconciliation</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Contract value · contracted seats · $/seat · actual M365 users · delta</p>
                        </div>
                        <Link href="/admin/ams/clients/new" className="text-blue-600 font-black text-sm flex items-center gap-1 hover:gap-2 transition-all">
                            Add Client <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {clients.length === 0 ? (
                        <div className="text-center py-20">
                            <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold">No AMS clients yet.</p>
                            <Link href="/admin/ams/clients/new" className="inline-flex items-center gap-2 mt-4 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700 transition-all">
                                <Plus className="h-4 w-4" /> Add your first client
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        {([
                                            ['Company', 'company_name'],
                                            ['Agreement', 'agreement_type'],
                                            ['Contact', 'contact_name'],
                                            ['Contract Value', 'monthly_amount'],
                                            ['Contracted', 'users_contracted'],
                                            ['$/Seat', 'price_per_user'],
                                            ['Total M365', null],
                                            ['Basic Licenses', null],
                                            ['Delta', null],
                                            ['M365 Status', 'm365_connected'],
                                            ['Contract End', 'contract_end'],
                                        ] as [string, string | null][]).map(([label, col]) => (
                                            <th key={label}
                                                onClick={col ? () => handleSort(col) : undefined}
                                                className={`py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap ${col ? 'cursor-pointer hover:text-slate-600 select-none' : ''}`}>
                                                <span className="inline-flex items-center gap-1">
                                                    {label}
                                                    {col && sortCol === col && (
                                                        sortDir === 'asc'
                                                            ? <ChevronUp className="h-3 w-3 text-blue-500" />
                                                            : <ChevronDown className="h-3 w-3 text-blue-500" />
                                                    )}
                                                </span>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedClients.map((client) => {
                                        const snap = client.ams_user_snapshots?.[0];
                                        const actual = snap?.total_licensed_users ?? null;
                                        const basic = snap?.basic_licensed_users ?? null;
                                        const contracted = client.users_contracted || 0;
                                        const monthly = parseFloat(client.monthly_amount) || 0;
                                        const ppu = parseFloat(client.price_per_user) || 0;
                                        const effectiveRate = ppu > 0 ? ppu : (contracted > 0 ? monthly / contracted : null);
                                        const delta = actual !== null ? actual - contracted : null;
                                        const contractEnd = client.contract_end ? new Date(client.contract_end) : null;
                                        const isExpired = contractEnd && contractEnd < now;
                                        const isExpiringSoon = contractEnd && !isExpired && contractEnd <= in90Days;

                                        return (
                                            <tr key={client.id} className={`border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${delta !== null && delta > 0 ? 'bg-red-50/20' : ''}`}>
                                                {/* Company */}
                                                <td className="py-4 px-3">
                                                    <p className="font-bold text-slate-900 text-xs leading-tight whitespace-nowrap">{client.company_name}</p>
                                                    {client.billing_cycle && client.billing_cycle !== 'Monthly' && (
                                                        <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">{client.billing_cycle}</span>
                                                    )}
                                                </td>
                                                {/* Agreement */}
                                                <td className="py-4 px-3">
                                                    <p className="text-xs font-bold text-slate-500 max-w-[120px] leading-tight">{client.agreement_type || '—'}</p>
                                                </td>
                                                {/* Contact */}
                                                <td className="py-4 px-3">
                                                    <p className="text-xs font-medium text-slate-700 whitespace-nowrap">{client.contact_name || '—'}</p>
                                                    {client.contact_email && (
                                                        <a href={`mailto:${client.contact_email}`} className="text-[11px] text-blue-400 hover:underline">{client.contact_email}</a>
                                                    )}
                                                </td>
                                                {/* Contract Value */}
                                                <td className="py-4 px-3 font-black text-slate-900 tabular-nums whitespace-nowrap">
                                                    {monthly === 0
                                                        ? <span className="text-slate-300">—</span>
                                                        : `$${monthly.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`}
                                                </td>
                                                {/* Contracted Seats */}
                                                <td className="py-4 px-3 font-bold text-slate-600 tabular-nums text-center">
                                                    {contracted > 0 ? contracted.toLocaleString() : <span className="text-slate-300">—</span>}
                                                </td>
                                                {/* $/Seat */}
                                                <td className="py-4 px-3 tabular-nums">
                                                    {effectiveRate !== null
                                                        ? <span className="font-bold text-slate-600">${effectiveRate.toFixed(2)}</span>
                                                        : <span className="text-slate-300">—</span>}
                                                </td>
                                                {/* Total M365 */}
                                                <td className="py-4 px-3 tabular-nums text-center">
                                                    {actual !== null
                                                        ? <span className="font-bold text-slate-700">{actual.toLocaleString()}</span>
                                                        : <span className="text-slate-300 text-xs font-bold">—</span>}
                                                </td>
                                                {/* Basic Licenses */}
                                                <td className="py-4 px-3 tabular-nums text-center">
                                                    {basic !== null
                                                        ? <span className="font-bold text-blue-600">{basic.toLocaleString()}</span>
                                                        : <span className="text-slate-300 text-xs font-bold">—</span>}
                                                </td>
                                                {/* Delta */}
                                                <td className="py-4 px-3">
                                                    {delta === null ? (
                                                        <Minus className="h-3 w-3 text-slate-200" />
                                                    ) : delta > 0 ? (
                                                        <span className="flex items-center gap-1 text-red-600 font-black text-xs whitespace-nowrap">
                                                            <TrendingUp className="h-3.5 w-3.5" />+{delta}
                                                        </span>
                                                    ) : delta < 0 ? (
                                                        <span className="flex items-center gap-1 text-amber-500 font-black text-xs whitespace-nowrap">
                                                            <TrendingDown className="h-3.5 w-3.5" />{delta}
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1 text-emerald-600 font-black text-xs">
                                                            <CheckCircle2 className="h-3.5 w-3.5" />0
                                                        </span>
                                                    )}
                                                </td>
                                                {/* M365 Status */}
                                                <td className="py-4 px-3">
                                                    {client.m365_connected ? (
                                                        <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black px-2.5 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                                                            <CheckCircle2 className="h-3 w-3 shrink-0" /> <span className="hidden sm:inline">Connected</span>
                                                        </span>
                                                    ) : (
                                                        <span className="bg-slate-100 text-slate-400 border border-slate-200 text-[10px] font-black px-2.5 py-1 rounded-full uppercase whitespace-nowrap w-max">
                                                            Not Connected
                                                        </span>
                                                    )}
                                                </td>
                                                {/* Contract End */}
                                                <td className="py-4 px-3 whitespace-nowrap">
                                                    {contractEnd ? (
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isExpired ? 'bg-red-50 text-red-600' : isExpiringSoon ? 'bg-amber-50 text-amber-600' : 'text-slate-400'}`}>
                                                            {contractEnd.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    ) : <span className="text-slate-300">—</span>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
