'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    Building2, Plus, Loader2, RefreshCw, ArrowLeft,
    CheckCircle2, AlertTriangle, TrendingDown, Edit2, Trash2,
    Calendar, DollarSign, User
} from 'lucide-react';

export default function AMSClientsPage() {
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<any[]>([]);
    const [syncingId, setSyncingId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const supabase = createClient();

    const fetchClients = async () => {
        const { data } = await (supabase
            .from('ams_clients') as any)
            .select(`*, ams_user_snapshots(total_licensed_users, synced_at)`)
            .order('company_name');
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

    const filtered = clients.filter(c =>
        c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.agreement_type?.toLowerCase().includes(search.toLowerCase())
    );

    // Group by agreement type for summary
    const totalMRR = clients.reduce((sum, c) => sum + (parseFloat(c.monthly_amount) || 0), 0);

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
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/ams" className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">AMS Clients</h1>
                            <p className="text-slate-400 font-medium text-sm mt-0.5">{clients.length} clients · <span className="text-emerald-600 font-bold">${totalMRR.toLocaleString('en-CA', { minimumFractionDigits: 2 })}/mo MRR</span></p>
                        </div>
                    </div>
                    <Link href="/admin/ams/clients/new" className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all">
                        <Plus className="h-4 w-4" /> Add Client
                    </Link>
                </header>

                {/* Search */}
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by company, contact, or agreement type..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full max-w-md px-4 py-3 rounded-2xl border border-slate-100 bg-white shadow-sm text-sm font-medium text-slate-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all"
                    />
                </div>

                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                    {filtered.length === 0 ? (
                        <div className="text-center py-20">
                            <Building2 className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold mb-4">No clients found.</p>
                            <Link href="/admin/ams/clients/new" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm hover:bg-blue-700">
                                <Plus className="h-4 w-4" /> Add your first client
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 bg-slate-50/50">
                                        {['Company', 'Agreement', 'Contact', 'Monthly $', 'Contract End', 'Status', 'M365 Status', 'Actions'].map(h => (
                                            <th key={h} className="py-3.5 px-4 text-left text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((client) => {
                                        const snap = client.ams_user_snapshots?.[0];
                                        const actual = snap?.total_licensed_users ?? null;
                                        const contracted = client.users_contracted || 0;
                                        const monthly = parseFloat(client.monthly_amount) || 0;
                                        const isSyncing = syncingId === client.id;
                                        const isOver = actual !== null && contracted > 0 && actual > contracted;
                                        const isUnder = actual !== null && contracted > 0 && actual < contracted;
                                        const contractEnd = client.contract_end ? new Date(client.contract_end) : null;
                                        const isExpiringSoon = contractEnd && contractEnd < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                                        const isExpired = contractEnd && contractEnd < new Date();

                                        return (
                                            <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                <td className="py-4 px-4">
                                                    <Link href={`/admin/ams/clients/${client.id}`} className="font-bold text-blue-600 hover:underline">
                                                        {client.company_name}
                                                    </Link>
                                                    {client.billing_cycle && client.billing_cycle !== 'Monthly' && (
                                                        <span className="ml-2 text-[10px] font-black uppercase bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">{client.billing_cycle}</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="text-xs font-bold text-slate-600 max-w-[140px] leading-tight">{client.agreement_type || '—'}</p>
                                                </td>
                                                <td className="py-4 px-4">
                                                    <p className="font-medium text-slate-700 text-xs">{client.contact_name || '—'}</p>
                                                    {client.contact_email && (
                                                        <a href={`mailto:${client.contact_email}`} className="text-[11px] text-blue-500 hover:underline">{client.contact_email}</a>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <span className={`font-black text-sm ${monthly === 0 ? 'text-slate-300' : 'text-slate-900'}`}>
                                                        {monthly === 0 ? '—' : `$${monthly.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4">
                                                    {contractEnd ? (
                                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isExpired ? 'bg-red-50 text-red-600' : isExpiringSoon ? 'bg-amber-50 text-amber-600' : 'text-slate-500'}`}>
                                                            {contractEnd.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    ) : '—'}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-1.5">
                                                        {client.m365_connected ? (
                                                            <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                                                                <CheckCircle2 className="h-3 w-3" /> Connected
                                                            </span>
                                                        ) : (
                                                            <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase">Not Connected</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-4 px-4">
                                                    {actual === null ? (
                                                        <span className="text-slate-300 font-bold text-xs">—</span>
                                                    ) : isOver ? (
                                                        <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                                                            <TrendingDown className="h-3 w-3" /> Over ({actual})
                                                        </span>
                                                    ) : isUnder ? (
                                                        <span className="bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black px-3 py-1 rounded-full uppercase w-max flex items-center gap-1">
                                                            <AlertTriangle className="h-3 w-3" /> Under ({actual})
                                                        </span>
                                                    ) : (
                                                        <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1 w-max">
                                                            <CheckCircle2 className="h-3 w-3" /> OK ({actual})
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/admin/ams/clients/${client.id}`} title="View Details"
                                                            className="h-8 w-8 rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors">
                                                            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                                                        </Link>
                                                        <Link href={`/admin/ams/clients/${client.id}/edit`} title="Edit"
                                                            className="h-8 w-8 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-900 hover:text-white flex items-center justify-center transition-colors">
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </Link>
                                                        <button onClick={() => handleDelete(client.id)} title="Delete"
                                                            className="h-8 w-8 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors">
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
