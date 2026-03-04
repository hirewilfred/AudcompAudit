'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    Building2, Plus, Loader2, RefreshCw, ArrowLeft,
    CheckCircle2, AlertTriangle, TrendingDown, Edit2, Trash2
} from 'lucide-react';

export default function AMSClientsPage() {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const fetchClients = async () => {
        const { data } = await supabase
            .from('ams_clients')
            .select(`*, ams_user_snapshots(total_licensed_users, synced_at)`)
            .order('company_name') as any;
        setClients(data || []);
        setLoading(false);
    };

    useEffect(() => { fetchClients(); }, []);

    const handleSync = async (clientId: string) => {
        setSyncingId(clientId);
        await fetch('/api/ams/sync-m365', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId })
        });
        await fetchClients();
        setSyncingId(null);
    };

    const handleDelete = async (clientId: string) => {
        if (!confirm('Delete this client? This cannot be undone.')) return;
        await (supabase.from('ams_clients') as any).delete().eq('id', clientId);
        fetchClients();
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
                        <Link href="/admin/ams" className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">AMS Clients</h1>
                            <p className="text-slate-400 font-medium text-sm mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''} total</p>
                        </div>
                    </div>
                    <Link href="/admin/ams/clients/new" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
                        <Plus className="h-4 w-4" /> Add Client
                    </Link>
                </header>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    {clients.length === 0 ? (
                        <div className="text-center py-20">
                            <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold mb-4">No AMS clients yet.</p>
                            <Link href="/admin/ams/clients/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700">
                                <Plus className="h-4 w-4" /> Add your first client
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        {['Company', 'Contracted', 'M365 Users', 'Price/User', 'Monthly', 'Status', 'Last Sync', 'Actions'].map(h => (
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
                                        const isOver = actual !== null && actual > contracted;
                                        const isUnder = actual !== null && actual < contracted;
                                        const isSyncing = syncingId === client.id;
                                        const hasM365 = !!client.m365_tenant_id;

                                        return (
                                            <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-3">
                                                    <p className="font-bold text-slate-900">{client.company_name}</p>
                                                    {client.notes && <p className="text-[11px] text-slate-400 font-medium truncate max-w-[160px]">{client.notes}</p>}
                                                </td>
                                                <td className="py-4 px-3 font-bold text-slate-600">{contracted.toLocaleString()}</td>
                                                <td className="py-4 px-3">
                                                    {actual !== null ? (
                                                        <span className={`font-black ${isOver ? 'text-red-600' : isUnder ? 'text-amber-600' : 'text-emerald-600'}`}>{actual.toLocaleString()}</span>
                                                    ) : <span className="text-slate-300 font-bold">—</span>}
                                                </td>
                                                <td className="py-4 px-3 font-bold text-slate-600">${ppu.toFixed(2)}</td>
                                                <td className="py-4 px-3 font-black text-slate-900">${(contracted * ppu).toLocaleString()}/mo</td>
                                                <td className="py-4 px-3">
                                                    {actual === null ? (
                                                        <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase">No Sync</span>
                                                    ) : isOver ? (
                                                        <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                                                            <TrendingDown className="h-3 w-3" /> Over
                                                        </span>
                                                    ) : isUnder ? (
                                                        <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black px-3 py-1 rounded-full uppercase w-max flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" /> Under
                                                        </span>
                                                    ) : (
                                                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                                                            <CheckCircle2 className="h-3 w-3" /> OK
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-3 text-[11px] text-slate-400 font-medium">
                                                    {snap?.synced_at ? new Date(snap.synced_at).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="py-4 px-3">
                                                    <div className="flex items-center gap-2">
                                                        {hasM365 && (
                                                            <button
                                                                onClick={() => handleSync(client.id)}
                                                                disabled={isSyncing}
                                                                title="Sync M365"
                                                                className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"
                                                            >
                                                                <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                                                            </button>
                                                        )}
                                                        <Link href={`/admin/ams/clients/${client.id}/edit`} title="Edit"
                                                            className="h-8 w-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-colors">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Link>
                                                        <button
                                                            onClick={() => handleDelete(client.id)}
                                                            title="Delete"
                                                            className="h-8 w-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
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
