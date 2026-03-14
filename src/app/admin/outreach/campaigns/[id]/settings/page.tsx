'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import { ArrowLeft, Loader2, Plus, Trash2, CheckCircle2 } from 'lucide-react';

interface EmailTemplate {
    step: number;
    subject: string;
    body: string;
    delay_days: number;
}

export default function CampaignSettingsPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ICP config
    const [industries, setIndustries] = useState('');
    const [companySize, setCompanySize] = useState('');
    const [geography, setGeography] = useState('');
    const [titleTargets, setTitleTargets] = useState('');

    // Sequence
    const [maxFollowUps, setMaxFollowUps] = useState(3);
    const [intervalDays, setIntervalDays] = useState(3);

    // Campaign meta
    const [campaignName, setCampaignName] = useState('');
    const [status, setStatus] = useState('draft');

    // Templates
    const [templates, setTemplates] = useState<EmailTemplate[]>([
        { step: 1, subject: '', body: '', delay_days: 0 },
    ]);

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/auth'); return; }

            const { data: camp } = await (supabase.from('outreach_campaigns') as any)
                .select('*')
                .eq('id', id)
                .single();

            if (!camp) { router.push('/admin/outreach/campaigns'); return; }

            setCampaignName(camp.name);
            setStatus(camp.status);
            setMaxFollowUps(camp.max_follow_ups ?? 3);
            setIntervalDays(camp.sequence_interval_days ?? 3);

            const icp = camp.icp_config || {};
            setIndustries(icp.industries || '');
            setCompanySize(icp.company_size || '');
            setGeography(icp.geography || '');
            setTitleTargets(icp.title_targets || '');

            if (camp.email_templates?.length > 0) {
                setTemplates(camp.email_templates);
            }

            setLoading(false);
        }
        load();
    }, [id]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSaved(false);

        const payload = {
            name: campaignName,
            status,
            max_follow_ups: maxFollowUps,
            sequence_interval_days: intervalDays,
            icp_config: {
                industries,
                company_size: companySize,
                geography,
                title_targets: titleTargets,
            },
            email_templates: templates,
        };

        const res = await fetch(`/api/outreach/campaigns/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const json = await res.json();
        setSaving(false);

        if (!res.ok) {
            setError(json.error || 'Failed to save.');
        } else {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    const addTemplate = () => {
        setTemplates(prev => [...prev, { step: prev.length + 1, subject: '', body: '', delay_days: 3 }]);
    };

    const removeTemplate = (i: number) => {
        setTemplates(prev => prev.filter((_, idx) => idx !== i).map((t, idx) => ({ ...t, step: idx + 1 })));
    };

    const updateTemplate = (i: number, field: keyof EmailTemplate, value: string | number) => {
        setTemplates(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
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
                <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href={`/admin/outreach/campaigns/${id}`}
                            className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Campaign Settings</h1>
                            <p className="text-slate-400 font-medium text-sm mt-0.5">{campaignName}</p>
                        </div>
                    </div>
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
                    </button>
                </header>

                {error && (
                    <div className="mb-6 px-5 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-bold text-sm">
                        {error}
                    </div>
                )}

                {/* Meta + ICP + Sequence */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Left: Campaign Meta + ICP */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-6">
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Campaign</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Name</label>
                                    <input value={campaignName} onChange={e => setCampaignName(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Status</label>
                                    <select value={status} onChange={e => setStatus(e.target.value)}
                                        className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                        <option value="draft">Draft</option>
                                        <option value="active">Active</option>
                                        <option value="paused">Paused</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-50 pt-6">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">ICP Config</h2>
                            <div className="space-y-4">
                                {[
                                    { label: 'Target Industries', value: industries, set: setIndustries, placeholder: 'e.g. Manufacturing, Healthcare, Non-profit' },
                                    { label: 'Company Size', value: companySize, set: setCompanySize, placeholder: 'e.g. 20-200 employees' },
                                    { label: 'Geography', value: geography, set: setGeography, placeholder: 'e.g. Southern Ontario, Canada' },
                                    { label: 'Target Titles', value: titleTargets, set: setTitleTargets, placeholder: 'e.g. IT Manager, Operations Director, CEO' },
                                ].map(field => (
                                    <div key={field.label}>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{field.label}</label>
                                        <input value={field.value} onChange={e => field.set(e.target.value)}
                                            placeholder={field.placeholder}
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Sequence Settings */}
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Sequence Settings</h2>
                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Max Follow-ups</label>
                                <p className="text-[10px] text-slate-400 font-medium mb-2">Number of follow-up emails after initial contact</p>
                                <input type="number" min={0} max={10} value={maxFollowUps}
                                    onChange={e => setMaxFollowUps(parseInt(e.target.value) || 0)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Interval Between Emails (days)</label>
                                <p className="text-[10px] text-slate-400 font-medium mb-2">Days to wait before sending the next email in sequence</p>
                                <input type="number" min={1} max={30} value={intervalDays}
                                    onChange={e => setIntervalDays(parseInt(e.target.value) || 1)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p className="text-xs font-black text-slate-600 mb-1">Sequence Summary</p>
                                <p className="text-sm text-slate-500 font-medium">
                                    {maxFollowUps + 1} total emails · {maxFollowUps > 0 ? `${intervalDays}-day intervals` : 'No follow-ups'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    Full sequence spans ~{maxFollowUps * intervalDays} days
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email Templates */}
                <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Email Templates</h2>
                            <p className="text-xs text-slate-400 font-medium mt-0.5">Ordered sequence — agents use these as starting points</p>
                        </div>
                        <button onClick={addTemplate}
                            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-black text-xs hover:bg-slate-200 transition-all">
                            <Plus className="h-3.5 w-3.5" /> Add Step
                        </button>
                    </div>

                    <div className="space-y-6">
                        {templates.map((tmpl, i) => (
                            <div key={i} className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">
                                        Step {tmpl.step}
                                        {i === 0 ? ' — Initial Outreach' : ` — Follow-up ${i}`}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-2">
                                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                                                {i === 0 ? 'Send immediately' : 'Send after'}
                                            </label>
                                            {i > 0 && (
                                                <>
                                                    <input type="number" min={1} max={30}
                                                        value={tmpl.delay_days}
                                                        onChange={e => updateTemplate(i, 'delay_days', parseInt(e.target.value) || 1)}
                                                        className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center" />
                                                    <span className="text-xs text-slate-400 font-medium">days</span>
                                                </>
                                            )}
                                        </div>
                                        {templates.length > 1 && (
                                            <button onClick={() => removeTemplate(i)}
                                                className="text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Subject Line</label>
                                        <input value={tmpl.subject}
                                            onChange={e => updateTemplate(i, 'subject', e.target.value)}
                                            placeholder="e.g. Quick question about your IT setup, {{first_name}}"
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 bg-white" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Email Body</label>
                                        <textarea value={tmpl.body}
                                            onChange={e => updateTemplate(i, 'body', e.target.value)}
                                            rows={6}
                                            placeholder="Hi {{first_name}},&#10;&#10;I noticed {{company_name}} is in {{industry}}..."
                                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300 bg-white resize-y font-mono" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button onClick={handleSave} disabled={saving}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
                            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
