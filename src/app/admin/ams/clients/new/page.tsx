'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import {
    ArrowLeft, Building2, Users, DollarSign, Cloud,
    Upload, Loader2, CheckCircle2, AlertCircle, FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function NewAMSClientPage() {
    const [form, setForm] = useState({
        company_name: '',
        users_contracted: '',
        price_per_user: '',
        m365_tenant_id: '',
        m365_client_id: '',
        m365_client_secret: '',
        notes: ''
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importedClients, setImportedClients] = useState<any[]>([]);
    const [importing, setImporting] = useState(false);
    const [importDone, setImportDone] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        const { error: insertError } = await (supabase.from('ams_clients') as any).insert({
            company_name: form.company_name,
            users_contracted: parseInt(form.users_contracted) || 0,
            price_per_user: parseFloat(form.price_per_user) || 0,
            m365_tenant_id: form.m365_tenant_id || null,
            m365_client_id: form.m365_client_id || null,
            m365_client_secret: form.m365_client_secret || null,
            notes: form.notes || null,
        });

        if (insertError) {
            setError(insertError.message);
            setSaving(false);
            return;
        }

        setSaved(true);
        setTimeout(() => router.push('/admin/ams'), 1200);
    };

    const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setImporting(true);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const data = new Uint8Array(evt.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

                // Map columns flexibly
                const mapped = rows.map((row) => ({
                    company_name: row['Company Name'] || row['company_name'] || row['Company'] || '',
                    users_contracted: parseInt(row['Users'] || row['users_contracted'] || row['Licensed Users'] || 0),
                    price_per_user: parseFloat(row['Price Per User'] || row['price_per_user'] || row['PPU'] || 0),
                    m365_tenant_id: row['Tenant ID'] || row['m365_tenant_id'] || null,
                    m365_client_id: row['Client ID'] || row['m365_client_id'] || null,
                    m365_client_secret: row['Client Secret'] || row['m365_client_secret'] || null,
                    notes: row['Notes'] || null,
                })).filter(r => r.company_name);

                setImportedClients(mapped);

                // Bulk insert
                if (mapped.length > 0) {
                    await (supabase.from('ams_clients') as any).insert(mapped);
                }

                setImportDone(true);
                setTimeout(() => router.push('/admin/ams'), 2000);
            } catch {
                setError('Failed to parse Excel file. Please check the format.');
            } finally {
                setImporting(false);
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />
            <main className="pl-64 pr-10 pt-10 pb-20">

                {/* Header */}
                <header className="flex items-center gap-4 mb-10">
                    <Link href="/admin/ams" className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors shadow-sm">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Add AMS Client</h1>
                        <p className="text-slate-400 font-medium text-sm mt-0.5">Manually enter a client or import from Excel</p>
                    </div>
                </header>

                <div className="grid grid-cols-12 gap-8">
                    {/* Manual Form */}
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

                            {/* M365 Section */}
                            <div className="pt-2">
                                <h3 className="text-sm font-black text-slate-700 flex items-center gap-2 mb-4">
                                    <Cloud className="h-4 w-4 text-blue-500" /> Microsoft 365 Connection <span className="text-slate-300 font-medium">(optional)</span>
                                </h3>
                                <div className="space-y-4 bg-blue-50/50 rounded-2xl p-5 border border-blue-100">
                                    {[
                                        { label: 'Tenant ID', name: 'm365_tenant_id', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
                                        { label: 'Client ID', name: 'm365_client_id', placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
                                        { label: 'Client Secret', name: 'm365_client_secret', placeholder: 'your-client-secret-value' },
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
                                    <p className="text-[10px] text-blue-500 font-bold">Required to auto-sync M365 licensed user counts.</p>
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
                                        'Save Client'}
                            </button>
                        </form>
                    </div>

                    {/* Excel Import */}
                    <div className="col-span-12 lg:col-span-5 space-y-6">
                        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-2">
                                <FileSpreadsheet className="h-5 w-5 text-emerald-600" /> Import from Excel
                            </h2>
                            <p className="text-sm text-slate-400 font-medium mb-6">Upload an Excel (.xlsx) or CSV file to bulk-import clients.</p>

                            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleExcelImport} />

                            <button
                                onClick={() => fileRef.current?.click()}
                                disabled={importing || importDone}
                                className={`w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 transition-all ${importDone ? 'border-emerald-400 bg-emerald-50' : 'border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'}`}
                            >
                                {importing ? <Loader2 className="h-8 w-8 text-blue-600 animate-spin" /> :
                                    importDone ? <CheckCircle2 className="h-8 w-8 text-emerald-500" /> :
                                        <Upload className="h-8 w-8 text-slate-300" />}
                                <span className="font-black text-sm text-slate-500">
                                    {importing ? 'Importing...' : importDone ? `Imported ${importedClients.length} clients!` : 'Click to upload Excel / CSV'}
                                </span>
                            </button>

                            <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Expected Column Names</p>
                                {['Company Name', 'Users (or Licensed Users)', 'Price Per User (or PPU)', 'Tenant ID', 'Client ID', 'Client Secret', 'Notes'].map(col => (
                                    <div key={col} className="flex items-center gap-2 py-1">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                                        <span className="text-xs font-bold text-slate-500">{col}</span>
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
