'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, ExternalLink, Layout, Phone, Bot, GraduationCap, Shield, Sparkles,
    CheckCircle2, Loader2, Copy, ChevronRight, Globe,
} from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';

type LP = {
    slug: string;
    label: string;
    path: string;
    icon: any;
    accent: string;       // tailwind gradient
    headline: string;
    sub: string;
    offer: string;
    audience: string;
    cta: string;
};

const PAGES: LP[] = [
    {
        slug: 'free-ai-audit',
        label: 'Free AI Audit',
        path: '/',
        icon: Sparkles,
        accent: 'from-blue-500 to-indigo-500',
        headline: 'See where AI can save your team 10+ hours/week.',
        sub: 'A free 10-minute readiness assessment, scored across 5 dimensions, with a personalized roadmap.',
        offer: 'Free 10-minute audit',
        audience: 'Any Canadian SMB curious about AI',
        cta: 'Start your audit',
    },
    {
        slug: 'ai-receptionist',
        label: 'AI Receptionist',
        path: '/ai-receptionist',
        icon: Phone,
        accent: 'from-emerald-500 to-teal-500',
        headline: 'Never miss a call, or a customer.',
        sub: '24/7 AI receptionist that answers, qualifies, and books straight into your calendar — in your voice.',
        offer: 'From $397/mo · 14-day setup',
        audience: 'Service businesses, dental, law, HVAC, contractors',
        cta: 'Book a demo',
    },
    {
        slug: 'custom-ai-agents',
        label: 'Custom AI Agents',
        path: '/custom-ai-agents',
        icon: Bot,
        accent: 'from-violet-500 to-fuchsia-500',
        headline: 'Stop paying people to copy-paste data.',
        sub: 'We build agents that ingest your docs and write the answers back to your CRM, accounting, or LOB system.',
        offer: '$1,497–$10K+ build · $250+/mo retainer',
        audience: 'Mid-market ops, finance, accounting, manufacturing',
        cta: 'Get a quote',
    },
    {
        slug: 'ai-training',
        label: 'AI Training',
        path: '/ai-training',
        icon: GraduationCap,
        accent: 'from-amber-500 to-orange-500',
        headline: 'Get your team using AI this week.',
        sub: 'Hands-on workshops taught by Audcomp engineers. Group, private, or self-paced.',
        offer: '$149–$6,000 / workshop',
        audience: 'Teams of 5+ that bought tools but aren\'t using them',
        cta: 'Book a workshop',
    },
    {
        slug: 'audcomp-360',
        label: 'Audcomp 360',
        path: '/audcomp-360',
        icon: Shield,
        accent: 'from-sky-500 to-blue-500',
        headline: 'Managed IT, security, and AI — one team, one bill.',
        sub: 'IT helpdesk, M365, security, backups, and AI rollouts bundled into one predictable monthly contract.',
        offer: 'From $99/user/mo',
        audience: 'Canadian businesses 20–200 employees',
        cta: 'Get a custom quote',
    },
];

export default function LandingPagesGalleryPage() {
    const [origin, setOrigin] = useState('');
    const [stats, setStats] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') setOrigin(window.location.origin);
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/admin/landing-submissions');
                const j = await res.json();
                setStats(j.counts ?? {});
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const copyUrl = async (url: string) => {
        await navigator.clipboard.writeText(url);
        setCopied(url);
        setTimeout(() => setCopied(null), 1500);
    };

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
                        <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-3">
                                    <Layout className="h-3 w-3" /> Live landing pages
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.05]">
                                    Our <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">landing pages</span>
                                </h1>
                                <p className="text-blue-100/80 text-sm mt-3 max-w-2xl leading-relaxed">
                                    The five entry points feeding the per-expert outreach funnel. Every form submission round-robin-routes to an expert and lands in their icebreaker queue.
                                </p>
                            </div>
                            <div className="bg-white/8 backdrop-blur border border-white/15 rounded-xl px-5 py-3">
                                <div className="text-3xl font-black text-white tabular-nums leading-none">{PAGES.length}</div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-blue-200 mt-1">Live pages</div>
                            </div>
                        </div>
                    </div>

                    {/* Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {PAGES.map(p => {
                            const fullUrl = origin ? `${origin}${p.path}` : p.path;
                            const submissions = stats[p.slug] ?? 0;
                            return (
                                <div key={p.slug} className="group bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-blue-200 transition-all overflow-hidden flex flex-col">
                                    {/* Mock browser frame */}
                                    <div className={`relative bg-gradient-to-br ${p.accent} p-5 h-44 overflow-hidden`}>
                                        <div
                                            className="absolute inset-0 opacity-25 pointer-events-none"
                                            style={{
                                                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)',
                                                backgroundSize: '20px 20px',
                                            }}
                                        />
                                        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-white/15 blur-3xl" />

                                        {/* Browser chrome */}
                                        <div className="relative bg-white/90 backdrop-blur rounded-t-lg border border-white/40 px-3 py-1.5 flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <span className="h-2 w-2 rounded-full bg-rose-400" />
                                                <span className="h-2 w-2 rounded-full bg-amber-400" />
                                                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                                            </div>
                                            <div className="flex-1 bg-white rounded-md px-2 py-0.5 font-mono text-[10px] text-slate-500 truncate">
                                                audcomp.com{p.path}
                                            </div>
                                        </div>
                                        <div className="relative bg-white rounded-b-lg border-x border-b border-white/40 px-4 py-3 mt-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`h-7 w-7 rounded-md bg-gradient-to-br ${p.accent} flex items-center justify-center text-white shrink-0`}>
                                                    <p.icon className="h-3.5 w-3.5" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{p.label}</span>
                                            </div>
                                            <p className="text-[11px] font-black text-slate-900 leading-snug line-clamp-2">{p.headline}</p>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="min-w-0">
                                                <h3 className="text-base font-black text-slate-900">{p.label}</h3>
                                                <code className="text-[11px] text-blue-700 font-mono">{p.path}</code>
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
                                            </span>
                                        </div>

                                        <p className="text-xs text-slate-600 leading-relaxed mb-3 line-clamp-2">{p.sub}</p>

                                        <div className="space-y-2 mb-4 text-[11px]">
                                            <div className="flex items-start gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 shrink-0 mt-0.5">Offer</span>
                                                <span className="text-slate-800 font-bold">{p.offer}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 shrink-0 mt-0.5">Target</span>
                                                <span className="text-slate-700">{p.audience}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 shrink-0 mt-0.5">CTA</span>
                                                <span className="text-slate-700 italic">"{p.cta}"</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                                            <Link
                                                href={`/admin/outreach/landing?slug=${p.slug}`}
                                                className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-700 hover:text-blue-800"
                                            >
                                                <Globe className="h-3 w-3" />
                                                {loading ? '…' : `${submissions} submissions`}
                                                <ChevronRight className="h-3 w-3" />
                                            </Link>
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => copyUrl(fullUrl)}
                                                    title="Copy URL"
                                                    className="inline-flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-600 hover:text-blue-700 border border-slate-200 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md transition-colors"
                                                >
                                                    {copied === fullUrl
                                                        ? <><CheckCircle2 className="h-3 w-3 text-emerald-600" /> Copied</>
                                                        : <><Copy className="h-3 w-3" /> URL</>
                                                    }
                                                </button>
                                                <a
                                                    href={p.path}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md shadow-sm shadow-blue-600/20 transition-colors"
                                                >
                                                    View live <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
}
