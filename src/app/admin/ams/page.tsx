'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    Building2, Users, DollarSign, AlertTriangle, TrendingDown,
    RefreshCw, Plus, Loader2, ArrowRight, CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AMSDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [syncing, setSyncing] = useState(false);
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

            const { data } = await supabase
                .from('ams_clients')
                .select(`*, ams_user_snapshots(total_licensed_users, snapshot_date, synced_at)`)
                .order('created_at', { ascending: false }) as any;

            setClients(data || []);
            setLoading(false);
        }
        load();
    }, []);

    // ── Derived Financial Metrics ──────────────────────────
    const totalContractedSeats = clients.reduce((sum, c) => sum + (c.users_contracted || 0), 0);
    const totalActualUsers = clients.reduce((sum, c) => {
        const snap = c.ams_user_snapshots?.[0];
        return sum + (snap?.total_licensed_users || 0);
    }, 0);
    const utilizationPct = totalContractedSeats > 0
        ? Math.round((totalActualUsers / totalContractedSeats) * 100)
        : 0;

    const potentialLostRevenue = clients.reduce((sum, c) => {
        const snap = c.ams_user_snapshots?.[0];
        const actual = snap?.total_licensed_users || 0;
        const contracted = c.users_contracted || 0;
        const ppu = parseFloat(c.price_per_user) || 0;
        if (actual > contracted) return sum + ((actual - contracted) * ppu);
        return sum;
    }, 0);

    const revenueRisk = clients.reduce((sum, c) => {
        const snap = c.ams_user_snapshots?.[0];
        const actual = snap?.total_licensed_users || 0;
        const contracted = c.users_contracted || 0;
        const ppu = parseFloat(c.price_per_user) || 0;
        if (actual < contracted) return sum + ((contracted - actual) * ppu);
        return sum;
    }, 0);

    const handleSyncAll = async () => {
        setSyncing(true);
        for (const client of clients) {
            if (client.m365_tenant_id && client.m365_client_id && client.m365_client_secret) {
                await fetch('/api/ams/sync-m365', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientId: client.id })
                });
            }
        }
        // Reload
        const { data } = await supabase
            .from('ams_clients')
            .select(`*, ams_user_snapshots(total_licensed_users, snapshot_date, synced_at)`)
            .order('created_at', { ascending: false }) as any;
        setClients(data || []);
        setSyncing(false);
    };

    const lastUpdated = new Date().toLocaleTimeString();

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
                <header className="flex items-end justify-between mb-10">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                            <CheckCircle2 className="h-3 w-3" /> AMS Portal Active
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">AMS Dashboard</h1>
                        <p className="text-slate-400 font-medium mt-2 text-sm">Annual Managed Services — Client Overview</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleSyncAll}
                            disabled={syncing}
                            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-3 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                            {syncing ? 'Syncing...' : 'Sync All M365'}
                        </button>
                        <Link
                            href="/admin/ams/clients/new"
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                        >
                            <Plus className="h-4 w-4" /> Add Client
                        </Link>
                    </div>
                </header>

                {/* Financial Overview Card */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-lg font-black text-slate-900">Financial Overview</h2>
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
                        {/* Total Contracted Seats */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 rounded-2xl p-5 border border-slate-100"
                        >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Contracted Seats</p>
                            <p className="text-4xl font-black text-slate-900 tabular-nums">{totalContractedSeats.toLocaleString()}</p>
                        </motion.div>

                        {/* Actual Billable Usage */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                            className="bg-slate-50 rounded-2xl p-5 border border-slate-100"
                        >
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Actual Billable Usage</p>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-black text-slate-900 tabular-nums">{totalActualUsers.toLocaleString()}</p>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full mb-1 ${utilizationPct >= 90 ? 'bg-emerald-100 text-emerald-700' : utilizationPct >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                    {utilizationPct}% Util
                                </span>
                            </div>
                        </motion.div>

                        {/* Potential Lost Revenue */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-slate-50 rounded-2xl p-5 border border-slate-100 relative overflow-hidden"
                        >
                            <DollarSign className="absolute top-3 right-3 h-10 w-10 text-slate-100" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Potential Lost Revenue</p>
                            <p className="text-4xl font-black text-slate-900 tabular-nums">
                                ${potentialLostRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">
                                {clients.filter(c => {
                                    const snap = c.ams_user_snapshots?.[0];
                                    return (snap?.total_licensed_users || 0) > c.users_contracted;
                                }).length} clients exceeding contract
                            </p>
                        </motion.div>

                        {/* Revenue Risk */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                            className={`rounded-2xl p-5 border relative overflow-hidden ${revenueRisk > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}
                        >
                            <AlertTriangle className={`absolute top-3 right-3 h-10 w-10 ${revenueRisk > 0 ? 'text-red-100' : 'text-slate-100'}`} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Revenue Risk (Under-utilization)</p>
                            <div className="flex items-center gap-2">
                                {revenueRisk > 0 && <AlertTriangle className="h-5 w-5 text-red-500" />}
                                <p className={`text-4xl font-black tabular-nums ${revenueRisk > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                                    ${revenueRisk.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold mt-1">Below minimum thresholds</p>
                        </motion.div>
                    </div>
                </div>

                {/* Client Table */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-slate-900">AMS Clients</h2>
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
                                    <tr className="border-b border-slate-100">
                                        {['Company', 'Contracted', 'Actual M365 Users', 'Price/User', 'Monthly Value', 'Status', ''].map(h => (
                                            <th key={h} className="py-3 px-3 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.map((client) => {
                                        const snap = client.ams_user_snapshots?.[0];
                                        const actual = snap?.total_licensed_users ?? null;
                                        const contracted = client.users_contracted || 0;
                                        const ppu = parseFloat(client.price_per_user) || 0;
                                        const monthlyValue = contracted * ppu;
                                        const isOver = actual !== null && actual > contracted;
                                        const isUnder = actual !== null && actual < contracted;

                                        return (
                                            <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-3 font-bold text-slate-900">{client.company_name}</td>
                                                <td className="py-4 px-3 font-bold text-slate-600">{contracted.toLocaleString()}</td>
                                                <td className="py-4 px-3">
                                                    {actual !== null ? (
                                                        <span className={`font-bold ${isOver ? 'text-red-600' : isUnder ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                            {actual.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 font-bold">Not synced</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-3 font-bold text-slate-600">${ppu.toFixed(2)}</td>
                                                <td className="py-4 px-3 font-black text-slate-900">${monthlyValue.toLocaleString()}/mo</td>
                                                <td className="py-4 px-3">
                                                    {actual === null ? (
                                                        <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">Pending Sync</span>
                                                    ) : isOver ? (
                                                        <span className="bg-red-100 text-red-700 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                                                            <TrendingDown className="h-3 w-3" /> Over Contract
                                                        </span>
                                                    ) : isUnder ? (
                                                        <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase w-max">Under-utilized</span>
                                                    ) : (
                                                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                                                            <CheckCircle2 className="h-3 w-3" /> On Target
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-3">
                                                    <Link href={`/admin/ams/clients/${client.id}/edit`} className="text-blue-600 font-black text-xs hover:underline">
                                                        Edit
                                                    </Link>
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
