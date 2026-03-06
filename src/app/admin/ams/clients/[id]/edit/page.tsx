'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    ArrowLeft, Building2, Users, DollarSign,
    Loader2, CheckCircle2, AlertCircle,
    Trash2, User, Mail, Calendar, FileText
} from 'lucide-react';

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
    const [error, setError] = useState<string | null>(null);

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
        notes: ''
    });

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function init() {

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
                notes: form.notes || null,
            })
            .eq('id', clientId);

        if (updateError) { setError(updateError.message); setSaving(false); return; }
        setSaved(true);
        setTimeout(() => router.push('/admin/ams/clients'), 1200);
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

                <div className="grid grid-cols-1 gap-8 max-w-4xl">
                    {/* Edit Form */}
                    <div className="col-span-1">
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
                                <div className="space-y-1.5">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Billing Cycle</label>
                                    <select name="billing_cycle" value={form.billing_cycle} onChange={handleChange}
                                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-100 bg-slate-50 font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all">
                                        {BILLING_CYCLES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
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
                </div>
            </main>
        </div>
    );
}
