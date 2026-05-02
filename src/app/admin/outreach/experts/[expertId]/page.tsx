'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, Megaphone, Inbox, Users2, Globe, KeyRound, MessageSquare,
    CheckCircle2, AlertTriangle, Mail, Linkedin, Sparkles, ChevronRight, ExternalLink,
    Plus, Activity,
} from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';

type Detail = {
    expert: {
        id: string;
        full_name: string | null;
        email: string | null;
        photo_url: string | null;
        title: string | null;
        bio: string | null;
        bookings_url: string | null;
    };
    campaigns: any[];
    leads: any[];
    inbox: any[];
    icebreakerQueue: any[];
    landingCaptures: any[];
    integrations: any[];
    totals: {
        campaigns_active: number;
        campaigns_total: number;
        leads_total: number;
        leads_replied: number;
        leads_booked: number;
        inbox_count: number;
        queue_count: number;
        landing_captures_30d: number;
    };
};

const fmtDate = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

const channelIcon = (c: string | null) => c === 'email' ? Mail : c === 'linkedin' ? Linkedin : Megaphone;

export default function ExpertOutreachDetailPage() {
    const params = useParams();
    const expertId = (params?.expertId as string) || '';
    const [data, setData] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!expertId) return;
        (async () => {
            try {
                const res = await fetch(`/api/admin/experts/outreach?expertId=${expertId}`);
                if (!res.ok) { setErr(`Load failed (${res.status})`); return; }
                setData(await res.json());
            } catch (e: any) {
                setErr(e.message);
            } finally {
                setLoading(false);
            }
        })();
    }, [expertId]);

    if (loading) return (
        <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
    );

    if (err || !data) return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            <AdminNavbar />
            <main className="pl-64 pr-8 pt-8">
                <Link href="/admin/outreach/experts" className="text-sm text-slate-500 hover:text-blue-600">← Back to experts</Link>
                <p className="mt-12 text-rose-700">{err ?? 'Expert not found.'}</p>
            </main>
        </div>
    );

    const e = data.expert;
    const t = data.totals;

    const liOAuth = data.integrations.find((i: any) => i.provider === 'linkedin_oauth' && i.is_active);
    const gmailOAuth = data.integrations.find((i: any) => i.provider === 'gmail_oauth' && i.is_active);
    const instantlyInbox = data.integrations.find((i: any) => i.provider === 'instantly' && i.is_active);

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            <div className="fixed top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                <div className="max-w-7xl mx-auto">
                    <Link href="/admin/outreach/experts" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-4">
                        <ArrowLeft className="h-3 w-3" /> All experts
                    </Link>

                    {/* Hero with expert identity + KPIs */}
                    <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 shadow-xl shadow-blue-900/20">
                        <div
                            className="absolute inset-0 opacity-30 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.35) 1px, transparent 0)',
                                backgroundSize: '24px 24px',
                            }}
                        />
                        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/30 blur-[120px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />

                        <div className="relative z-10 p-8 md:p-10">
                            <div className="flex items-start gap-5 mb-6">
                                {e.photo_url ? (
                                    <img src={e.photo_url} alt="" className="h-20 w-20 rounded-2xl object-cover border-2 border-white/20" />
                                ) : (
                                    <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur border-2 border-white/20 flex items-center justify-center text-white text-3xl font-black">
                                        {(e.full_name || 'E').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">{e.full_name || 'Unnamed expert'}</h1>
                                    {e.title && <p className="text-blue-200 text-sm font-bold mt-1">{e.title}</p>}
                                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs">
                                        {e.email && <span className="inline-flex items-center gap-1.5 text-blue-100"><Mail className="h-3 w-3" />{e.email}</span>}
                                        {e.bookings_url && (
                                            <a href={e.bookings_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-blue-100 hover:text-white">
                                                Bookings <ExternalLink className="h-3 w-3" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <Link
                                    href={`/admin/outreach/campaigns/new?expertId=${e.id}`}
                                    className="hidden md:inline-flex items-center gap-2 bg-white text-slate-900 hover:bg-blue-50 hover:text-blue-700 font-black text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl transition-colors"
                                >
                                    <Plus className="h-3.5 w-3.5" /> New campaign
                                </Link>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <HeroKpi label="Active campaigns" value={t.campaigns_active} sub={`${t.campaigns_total} total`} />
                                <HeroKpi label="Leads" value={t.leads_total} sub={`${t.leads_replied} replied`} />
                                <HeroKpi label="Bookings" value={t.leads_booked} accent="emerald" />
                                <HeroKpi label="Pending review" value={t.queue_count} accent={t.queue_count > 0 ? 'amber' : 'default'} />
                            </div>
                        </div>
                    </div>

                    {/* Connected accounts row */}
                    <Section icon={KeyRound} title="Connected accounts" tint="blue">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <AccountTile
                                icon={Linkedin}
                                label="LinkedIn"
                                connected={!!liOAuth}
                                detail={liOAuth ? `Token last 4: ${liOAuth.last4}` : 'Not connected — required for LinkedIn campaigns'}
                            />
                            <AccountTile
                                icon={Mail}
                                label="Email send (Instantly)"
                                connected={!!instantlyInbox}
                                detail={instantlyInbox ? `Inbox last 4: ${instantlyInbox.last4}` : `Falls back to corporate Instantly key`}
                            />
                            <AccountTile
                                icon={Mail}
                                label="Gmail OAuth"
                                connected={!!gmailOAuth}
                                detail={gmailOAuth ? `Token last 4: ${gmailOAuth.last4}` : 'Optional — direct send from expert\'s Gmail'}
                            />
                        </div>
                        <Link href="/admin/outreach/integrations" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-4">
                            Manage integrations <ChevronRight className="h-3 w-3" />
                        </Link>
                    </Section>

                    {/* Active campaigns */}
                    <Section icon={Megaphone} title={`Campaigns (${data.campaigns.length})`} tint="blue">
                        {data.campaigns.length === 0 ? (
                            <EmptyRow text="No campaigns yet for this expert." linkHref={`/admin/outreach/campaigns/new?expertId=${e.id}`} linkText="Create the first one" />
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {data.campaigns.map((c: any) => {
                                    const Icon = channelIcon(c.channel);
                                    const replyRate = c.stats_contacted > 0 ? Math.round((c.stats_replied / c.stats_contacted) * 100) : 0;
                                    return (
                                        <Link
                                            key={c.id}
                                            href={`/admin/outreach/campaigns/${c.id}`}
                                            className="bg-gradient-to-br from-blue-50/60 to-white border border-blue-100 rounded-xl p-4 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <div className="flex items-start gap-3 min-w-0">
                                                    <div className="h-9 w-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                                        <Icon className="h-4 w-4" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-sm font-black text-slate-900 truncate">{c.name}</h4>
                                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">{c.channel} · {fmtDate(c.updated_at)}</div>
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border shrink-0 ${
                                                    c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                        : c.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                        : 'bg-slate-50 text-slate-500 border-slate-100'
                                                }`}>{c.status}</span>
                                            </div>
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <CampStat label="Researched" value={c.stats_researched} />
                                                <CampStat label="Contacted" value={c.stats_contacted} />
                                                <CampStat label="Replied" value={c.stats_replied} accent={replyRate >= 10 ? 'emerald' : undefined} />
                                                <CampStat label="Booked" value={c.stats_booked} accent="blue" />
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </Section>

                    {/* Two-column: Inbox + Icebreaker queue */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <Section icon={Inbox} title={`Reply inbox (${data.inbox.length})`} tint="emerald" mb={false}>
                            {data.inbox.length === 0 ? (
                                <EmptyRow text="No replies waiting for a follow-up." />
                            ) : (
                                <div className="space-y-2">
                                    {data.inbox.slice(0, 8).map((l: any) => (
                                        <div key={l.id} className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-3 flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-slate-900 truncate">{l.contact_name || l.contact_email}</div>
                                                <div className="text-[11px] text-slate-500 truncate">{l.company_name || l.contact_title}</div>
                                            </div>
                                            <div className="text-[10px] font-black text-emerald-700 uppercase tracking-widest shrink-0">
                                                Replied {fmtDate(l.replied_at)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Section>

                        <IcebreakerQueue queue={data.icebreakerQueue} expertId={expertId} />
                    </div>

                    {/* Landing-page captures */}
                    <Section icon={Globe} title={`Landing-page captures (${data.landingCaptures.length})`} tint="blue">
                        {data.landingCaptures.length === 0 ? (
                            <EmptyRow text="No landing-page submissions assigned to this expert yet." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/50">
                                            {['Lead', 'Company', 'Page', 'UTM', 'Captured'].map(h => (
                                                <th key={h} className="px-4 py-2 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.landingCaptures.slice(0, 15).map((s: any) => (
                                            <tr key={s.id}>
                                                <td className="px-4 py-2.5">
                                                    <div className="text-sm font-bold text-slate-900">{s.full_name || '—'}</div>
                                                    <div className="text-[11px] text-slate-500">{s.email}</div>
                                                </td>
                                                <td className="px-4 py-2.5 text-sm text-slate-700">{s.organization || '—'}</td>
                                                <td className="px-4 py-2.5 text-xs">
                                                    <span className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                                                        {s.landing_page_slug}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-xs text-slate-500">
                                                    {s.utm_source ? `${s.utm_source} / ${s.utm_campaign || '—'}` : '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-xs text-slate-500 tabular-nums">{fmtDate(s.captured_at)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Section>
                </div>
            </main>
        </div>
    );
}

function HeroKpi({ label, value, sub, accent }: { label: string; value: number; sub?: string; accent?: 'emerald' | 'amber' | 'default' }) {
    const tone = accent === 'emerald' ? 'text-emerald-300'
        : accent === 'amber' ? 'text-amber-300'
        : 'text-white';
    return (
        <div className="bg-white/8 backdrop-blur border border-white/15 rounded-xl px-4 py-3">
            <div className={`text-2xl font-black tabular-nums leading-none ${tone}`}>{value}</div>
            <div className="text-[10px] font-black uppercase tracking-widest text-blue-200 mt-1">{label}</div>
            {sub && <div className="text-[10px] text-blue-200/70 mt-0.5">{sub}</div>}
        </div>
    );
}

function CampStat({ label, value, accent }: { label: string; value: number; accent?: 'emerald' | 'blue' }) {
    const tint = accent === 'emerald' ? 'text-emerald-600' : accent === 'blue' ? 'text-blue-600' : 'text-slate-900';
    return (
        <div className="bg-white border border-slate-100 rounded-md py-1.5">
            <div className={`text-sm font-black tabular-nums ${tint}`}>{value || 0}</div>
            <div className="text-[8px] font-black uppercase tracking-widest text-slate-500">{label}</div>
        </div>
    );
}

function AccountTile({ icon: Icon, label, connected, detail }: { icon: any; label: string; connected: boolean; detail: string }) {
    return (
        <div className={`rounded-xl p-4 border ${connected ? 'bg-emerald-50/40 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${connected ? 'bg-white text-emerald-600 border-emerald-100' : 'bg-white text-slate-400 border-slate-100'}`}>
                        <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-black text-slate-900">{label}</span>
                </div>
                {connected ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                )}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">{detail}</p>
        </div>
    );
}

function EmptyRow({ text, linkHref, linkText }: { text: string; linkHref?: string; linkText?: string }) {
    return (
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
            <p className="text-sm text-slate-500 font-medium">{text}</p>
            {linkHref && linkText && (
                <Link href={linkHref} className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mt-2">
                    {linkText} <ChevronRight className="h-3 w-3" />
                </Link>
            )}
        </div>
    );
}

function IcebreakerQueue({ queue, expertId }: { queue: any[]; expertId: string }) {
    const [items, setItems] = useState<any[]>(queue);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [busy, setBusy] = useState(false);
    useEffect(() => { setItems(queue); }, [queue]);

    const toggle = (id: string) => {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id); else next.add(id);
        setSelected(next);
    };

    const act = async (action: 'approve' | 'decline', ids?: string[]) => {
        const target = ids ?? Array.from(selected);
        if (target.length === 0) return;
        setBusy(true);
        const res = await fetch('/api/outreach/leads/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ leadIds: target, action }),
        });
        const j = await res.json();
        if (res.ok) {
            setItems(prev => prev.filter(l => !target.includes(l.id)));
            setSelected(new Set());
        } else {
            alert(j.error || 'Failed');
        }
        setBusy(false);
    };

    return (
        <Section icon={MessageSquare} title={`Icebreaker queue (${items.length})`} tint="amber" mb={false}>
            {items.length === 0 ? (
                <EmptyRow text="Nothing waiting for approval right now." />
            ) : (
                <>
                    {selected.size > 0 && (
                        <div className="flex items-center gap-2 mb-3 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                            <span className="text-xs font-bold text-blue-900">{selected.size} selected</span>
                            <div className="flex-1" />
                            <button
                                disabled={busy}
                                onClick={() => act('approve')}
                                className="text-[10px] font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                            >Approve</button>
                            <button
                                disabled={busy}
                                onClick={() => act('decline')}
                                className="text-[10px] font-black uppercase tracking-widest bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                            >Decline</button>
                        </div>
                    )}
                    <div className="space-y-2 max-h-[420px] overflow-y-auto">
                        {items.map((l: any) => {
                            const draft = l.custom_fields?.icebreaker
                                ?? l.custom_fields?.drafts?.icebreaker
                                ?? null;
                            const isSel = selected.has(l.id);
                            return (
                                <label
                                    key={l.id}
                                    className={`flex items-start gap-3 rounded-lg p-3 border cursor-pointer transition-colors ${
                                        isSel ? 'bg-blue-50 border-blue-200' : 'bg-amber-50/40 border-amber-100 hover:bg-amber-50'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isSel}
                                        onChange={() => toggle(l.id)}
                                        className="mt-1 h-4 w-4 accent-blue-600 shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-slate-900 truncate">{l.contact_name || l.contact_email}</div>
                                                <div className="text-[11px] text-slate-500 truncate">{l.company_name || l.contact_title}</div>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button
                                                    onClick={(e) => { e.preventDefault(); act('approve', [l.id]); }}
                                                    disabled={busy}
                                                    title="Approve"
                                                    className="h-6 w-6 rounded-md bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 flex items-center justify-center"
                                                >
                                                    <CheckCircle2 className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); act('decline', [l.id]); }}
                                                    disabled={busy}
                                                    title="Decline"
                                                    className="h-6 w-6 rounded-md bg-white text-rose-700 border border-rose-200 hover:bg-rose-50 flex items-center justify-center"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        </div>
                                        {draft && (
                                            <p className="mt-2 text-[12px] text-slate-700 italic leading-relaxed border-l-2 border-amber-300 pl-2">
                                                "{typeof draft === 'string' ? draft : JSON.stringify(draft)}"
                                            </p>
                                        )}
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </>
            )}
        </Section>
    );
}

function Section({
    icon: Icon, title, tint, children, mb = true,
}: { icon: any; title: string; tint: 'blue' | 'emerald' | 'amber' | 'rose'; children: React.ReactNode; mb?: boolean }) {
    const map = {
        blue: 'text-blue-700 bg-blue-50 border-blue-100',
        emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
        amber: 'text-amber-700 bg-amber-50 border-amber-100',
        rose: 'text-rose-700 bg-rose-50 border-rose-100',
    };
    return (
        <section className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-6 ${mb ? 'mb-6' : ''}`}>
            <div className="flex items-center gap-3 mb-5">
                <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${map[tint]}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-base font-black text-slate-900">{title}</h2>
            </div>
            {children}
        </section>
    );
}
