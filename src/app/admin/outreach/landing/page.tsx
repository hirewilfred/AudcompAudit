'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Globe, Loader2, ChevronRight, Mail, Phone, Building2,
} from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';

const SLUGS = [
    { slug: 'free-ai-audit',     label: 'Free AI Audit' },
    { slug: 'ai-receptionist',   label: 'AI Receptionist' },
    { slug: 'custom-ai-agents',  label: 'Custom AI Agents' },
    { slug: 'ai-training',       label: 'AI Training' },
    { slug: 'audcomp-360',       label: 'Audcomp 360' },
];

type Submission = {
    id: string;
    landing_page_slug: string;
    email: string;
    full_name: string | null;
    organization: string | null;
    phone: string | null;
    referrer: string | null;
    utm_source: string | null;
    utm_medium: string | null;
    utm_campaign: string | null;
    captured_at: string;
    assigned_expert_id: string | null;
    audit_user_id: string | null;
    expert: { id: string; full_name: string | null; photo_url: string | null } | null;
};

const fmtDate = (s: string) => new Date(s).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
});

export default function LandingSubmissionsPage() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<Submission[]>([]);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [filter, setFilter] = useState<string>('all');

    const refresh = async () => {
        setLoading(true);
        const url = filter === 'all'
            ? '/api/admin/landing-submissions'
            : `/api/admin/landing-submissions?slug=${filter}`;
        const res = await fetch(url);
        const j = await res.json();
        setRows(j.submissions ?? []);
        setCounts(j.counts ?? {});
        setLoading(false);
    };
    useEffect(() => { refresh(); }, [filter]);

    const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            <div className="fixed top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                <div className="max-w-7xl mx-auto">
                    <Link href="/admin/outreach" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-4">
                        <ArrowLeft className="h-3 w-3" /> Back to Outreach
                    </Link>

                    {/* Hero */}
                    <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-8 md:p-10 shadow-xl shadow-blue-900/20">
                        <div
                            className="absolute inset-0 opacity-30 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.35) 1px, transparent 0)',
                                backgroundSize: '24px 24px',
                            }}
                        />
                        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/30 blur-[120px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-3">
                                <Globe className="h-3 w-3" /> Landing-page funnel
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.05]">
                                Captured <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">leads</span>
                            </h1>
                            <p className="text-blue-100/80 text-sm mt-3 max-w-2xl leading-relaxed">
                                Every form submission across the five landing pages, auto-assigned to an expert via round-robin and mirrored into their inbound campaign.
                            </p>
                            <div className="text-3xl font-black tabular-nums text-white mt-6">{total}<span className="text-blue-200/60 text-base font-bold ml-2">submissions</span></div>
                        </div>
                    </div>

                    {/* Slug filter chips */}
                    <div className="flex flex-wrap items-center gap-2 mb-6">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
                                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                            }`}
                        >
                            All <span className="ml-1.5 tabular-nums">{total}</span>
                        </button>
                        {SLUGS.map(s => (
                            <button
                                key={s.slug}
                                onClick={() => setFilter(s.slug)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
                                    filter === s.slug ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                                {s.label} <span className="ml-1.5 tabular-nums opacity-70">{counts[s.slug] ?? 0}</span>
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                            <Globe className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 font-medium">No submissions{filter !== 'all' ? ` for ${filter}` : ''} yet.</p>
                            <p className="text-xs text-slate-400 mt-2">Form submissions on the landing pages will land here automatically.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            {['Lead', 'Company', 'Page', 'Source', 'Assigned to', 'Captured'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {rows.map(r => (
                                            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="text-sm font-bold text-slate-900">{r.full_name || '—'}</div>
                                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                                                        <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                                                        {r.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {r.organization ? (
                                                        <span className="inline-flex items-center gap-1.5"><Building2 className="h-3 w-3 text-slate-400" />{r.organization}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {r.landing_page_slug}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500">
                                                    {r.utm_source ? `${r.utm_source}${r.utm_campaign ? ' / ' + r.utm_campaign : ''}` : (r.referrer ? new URL(r.referrer).hostname : '—')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {r.expert ? (
                                                        <Link
                                                            href={`/admin/outreach/experts/${r.expert.id}`}
                                                            className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-blue-600"
                                                        >
                                                            {r.expert.photo_url
                                                                ? <img src={r.expert.photo_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                                                                : <span className="h-5 w-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-[10px] font-black">{(r.expert.full_name || 'E').charAt(0)}</span>
                                                            }
                                                            {r.expert.full_name}
                                                        </Link>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500 tabular-nums whitespace-nowrap">{fmtDate(r.captured_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
