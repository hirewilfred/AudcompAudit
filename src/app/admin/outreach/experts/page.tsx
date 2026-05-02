'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    UserCircle, Megaphone, Inbox, Users2, ArrowRight, Loader2, Sparkles, ChevronRight,
} from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';

type ExpertRow = {
    id: string;
    full_name: string | null;
    email: string | null;
    photo_url: string | null;
    title: string | null;
    campaigns_active: number;
    campaigns_total: number;
    leads_total: number;
    leads_replied: number;
    leads_booked: number;
    queue_count: number;
    landings_7d: number;
};

export default function ExpertsOutreachPage() {
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<ExpertRow[]>([]);

    useEffect(() => {
        (async () => {
            const res = await fetch('/api/admin/experts/outreach');
            const j = await res.json();
            setRows(j.experts ?? []);
            setLoading(false);
        })();
    }, []);

    const totals = rows.reduce((acc, r) => ({
        active: acc.active + r.campaigns_active,
        leads: acc.leads + r.leads_total,
        replied: acc.replied + r.leads_replied,
        queue: acc.queue + r.queue_count,
    }), { active: 0, leads: 0, replied: 0, queue: 0 });

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            <div className="fixed top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                <div className="max-w-7xl mx-auto">
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
                        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-3">
                                    <UserCircle className="h-3 w-3" /> Outreach by Expert
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.05]">
                                    Per-expert <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">campaigns</span>
                                </h1>
                                <p className="text-blue-100/80 text-sm mt-3 max-w-2xl leading-relaxed">
                                    Every expert runs their own LinkedIn + email campaigns. Click into any expert to manage their pipeline, icebreaker queue, and landing-page captures.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 max-w-md">
                                <KpiTile label="Active campaigns" value={totals.active} />
                                <KpiTile label="Pipeline leads" value={totals.leads} />
                                <KpiTile label="Replied" value={totals.replied} />
                                <KpiTile label="Pending review" value={totals.queue} accent={totals.queue > 0 ? 'amber' : undefined} />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                            <p className="text-sm text-slate-500 font-medium mb-3">No experts on file yet.</p>
                            <Link href="/admin/experts/new" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700">
                                Add your first expert <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {rows.map(r => (
                                <Link
                                    key={r.id}
                                    href={`/admin/outreach/experts/${r.id}`}
                                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 p-5 transition-all"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        {r.photo_url ? (
                                            <img src={r.photo_url} alt="" className="h-14 w-14 rounded-2xl object-cover border border-slate-100" />
                                        ) : (
                                            <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-lg font-black">
                                                {(r.full_name || 'E').charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-base font-black text-slate-900 truncate">{r.full_name || 'Unnamed expert'}</h3>
                                            <p className="text-[11px] text-slate-500 font-medium truncate">{r.title || r.email || ''}</p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                                    </div>

                                    <div className="grid grid-cols-3 gap-2 mb-3">
                                        <Stat icon={Megaphone} label="Active" value={r.campaigns_active} sub={`${r.campaigns_total} total`} />
                                        <Stat icon={Users2} label="Leads" value={r.leads_total} sub={`${r.leads_replied} replied`} />
                                        <Stat icon={Inbox} label="Queue" value={r.queue_count} accent={r.queue_count > 0 ? 'amber' : undefined} />
                                    </div>

                                    <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-500">Landings · 7d</span>
                                        <span className="text-blue-600 tabular-nums">{r.landings_7d}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function KpiTile({ label, value, accent }: { label: string; value: number; accent?: 'amber' }) {
    return (
        <div className="bg-white/8 backdrop-blur border border-white/15 rounded-xl px-4 py-3">
            <div className={`text-2xl font-black tabular-nums leading-none ${accent === 'amber' ? 'text-amber-300' : 'text-white'}`}>{value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-200 mt-1">{label}</div>
        </div>
    );
}

function Stat({ icon: Icon, label, value, sub, accent }: { icon: any; label: string; value: number; sub?: string; accent?: 'amber' }) {
    return (
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 mb-1">
                <Icon className={`h-3 w-3 ${accent === 'amber' ? 'text-amber-600' : 'text-blue-600'}`} />
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
            </div>
            <div className={`text-base font-black tabular-nums leading-none ${accent === 'amber' && value > 0 ? 'text-amber-700' : 'text-slate-900'}`}>{value}</div>
            {sub && <div className="text-[9px] text-slate-500 font-medium mt-0.5">{sub}</div>}
        </div>
    );
}
