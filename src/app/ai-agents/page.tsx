'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    ArrowRight, Sparkles, Target, Database, MessageSquare, MessageCircle,
    Calendar, BookOpen, PenLine, Camera, CalendarDays, Search, Bot, ClipboardCheck,
    BarChart3, Users, FileText, Play, Zap, ShieldCheck,
} from 'lucide-react';
import { AGENT_CATALOG, AgentCatalogEntry } from '@/lib/agent-catalog';
import SiteNav from '@/components/SiteNav';

const ICON_MAP: Record<string, React.ElementType> = {
    Sparkles, Target, Database, MessageSquare, MessageCircle, Calendar, BookOpen,
    PenLine, Camera, CalendarDays, Search, Bot, ClipboardCheck, BarChart3, Users, FileText,
};

// Brand palette — every agent uses a blue/indigo derivative so the page stays on-brand.
const COLOR_MAP: Record<AgentCatalogEntry['color'], { iconBg: string; iconText: string; chip: string; accentBar: string }> = {
    violet:  { iconBg: 'bg-indigo-50',  iconText: 'text-indigo-600',  chip: 'bg-indigo-50 text-indigo-700',  accentBar: 'from-indigo-500 to-blue-500' },
    cyan:    { iconBg: 'bg-sky-50',     iconText: 'text-sky-600',     chip: 'bg-sky-50 text-sky-700',        accentBar: 'from-sky-500 to-blue-500' },
    emerald: { iconBg: 'bg-blue-50',    iconText: 'text-blue-600',    chip: 'bg-blue-50 text-blue-700',      accentBar: 'from-blue-600 to-indigo-500' },
    amber:   { iconBg: 'bg-blue-50',    iconText: 'text-blue-700',    chip: 'bg-blue-50 text-blue-800',      accentBar: 'from-blue-700 to-indigo-600' },
    rose:    { iconBg: 'bg-indigo-50',  iconText: 'text-indigo-700',  chip: 'bg-indigo-50 text-indigo-800',  accentBar: 'from-indigo-600 to-blue-600' },
    sky:     { iconBg: 'bg-sky-50',     iconText: 'text-sky-700',     chip: 'bg-sky-50 text-sky-800',        accentBar: 'from-sky-600 to-blue-600' },
    pink:    { iconBg: 'bg-indigo-50',  iconText: 'text-indigo-600',  chip: 'bg-indigo-50 text-indigo-700',  accentBar: 'from-indigo-500 to-blue-600' },
    lime:    { iconBg: 'bg-blue-50',    iconText: 'text-blue-600',    chip: 'bg-blue-50 text-blue-700',      accentBar: 'from-blue-500 to-sky-500' },
};

const HERO_AGENTS = [
    'marketing-orchestrator', 'lead-hunter', 'lead-enricher',
    'outreach-strategist', 'engagement-responder', 'special-events-coord',
].map(id => AGENT_CATALOG.find(a => a.id === id)!).filter(Boolean);

export default function AIAgentsLandingPage() {
    const router = useRouter();
    const supabase = createClient();
    const [authReady, setAuthReady] = useState(false);
    const [signedIn, setSignedIn] = useState(false);

    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSignedIn(!!session);
            setAuthReady(true);
        })();
    }, []);

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800 selection:bg-blue-600/10">

            {/* Soft brand glow accents */}
            <div className="fixed top-[-15%] right-[-10%] h-[600px] w-[600px] rounded-full bg-blue-300/30 blur-[140px] pointer-events-none" />
            <div className="fixed bottom-[-15%] left-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-200/40 blur-[140px] pointer-events-none" />

            <SiteNav activeCta="agents" />

            <main className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 pt-20 pb-24">

                {/* ── HERO ─────────────────────────────────────── */}
                <section className="text-center mb-24">
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 bg-white border border-blue-100 rounded-full px-4 py-1.5 mb-7 shadow-sm shadow-blue-600/10"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">AI Agent Assessment · Free · 5 Minutes</span>
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="text-5xl md:text-7xl font-black tracking-[-0.02em] leading-[1.02] text-slate-900 mb-7"
                    >
                        Build the AI Agents
                        <br />
                        <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent">
                            your business is missing.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium"
                    >
                        Five focused questions. We map your departments to the right agents — Lead Hunter, Marketing Orchestrator,
                        Engagement Responder, and more — and scope a 2, 4, or 6-agent build with one of our AI Experts.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-3"
                    >
                        <Link
                            href={signedIn ? "/ai-agents/assessment" : "/auth?next=/ai-agents/assessment"}
                            className="group inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-sm px-7 py-4 rounded-2xl shadow-xl shadow-blue-600/30 transition-all hover:scale-[1.02]"
                        >
                            <Sparkles className="h-4 w-4" />
                            Start AI Agent Assessment
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black uppercase tracking-widest text-xs px-5 py-3 rounded-2xl shadow-sm transition-all"
                        >
                            View My Dashboard
                        </Link>
                    </motion.div>

                    {/* Trust ribbon */}
                    <div className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[11px] font-bold text-slate-500">
                        <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Built by Audcomp · 25+ years</div>
                        <div className="flex items-center gap-2"><Bot className="h-3.5 w-3.5 text-blue-600" /> 18+ agent templates ready</div>
                        <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-blue-600" /> First agent shipped in 30 days</div>
                    </div>
                </section>

                {/* ── HERO GALLERY ─────────────────────────────── */}
                <section className="mb-24">
                    <div className="text-center mb-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Sample of the agent roster</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black text-center mb-3 text-slate-900 tracking-tight">Total Team Overview</h2>
                    <p className="text-sm text-slate-500 text-center mb-12 max-w-xl mx-auto">A glimpse of the agents we've already templated. Your assessment picks the ones you actually need.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {HERO_AGENTS.map((agent, i) => {
                            const c = COLOR_MAP[agent.color];
                            const Icon = ICON_MAP[agent.icon] || Bot;
                            return (
                                <motion.div
                                    key={agent.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.45 }}
                                    viewport={{ once: true }}
                                    className="group relative rounded-3xl bg-white p-6 border border-slate-200/70 shadow-sm hover:shadow-xl hover:shadow-blue-600/5 hover:border-blue-200 transition-all overflow-hidden"
                                >
                                    {/* Top accent bar */}
                                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${c.accentBar}`} />

                                    <div className="flex items-start gap-4 mb-5">
                                        <div className={`h-14 w-14 rounded-2xl ${c.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                            <Icon className={`h-6 w-6 ${c.iconText}`} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-black text-lg text-slate-900 leading-tight tracking-tight">{agent.name}</h3>
                                            <p className="text-[11px] font-mono text-slate-400 mt-0.5">{agent.slug}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Last Run</div>
                                            <div className="text-emerald-600 font-black text-sm tabular-nums">{agent.sampleStats.lastRunLabel}</div>
                                        </div>
                                        <div className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2.5">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Success Rate</div>
                                            <div className="text-emerald-600 font-black text-sm tabular-nums">{agent.sampleStats.successRate}%</div>
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-4">{agent.description}</p>

                                    <div className="flex flex-wrap gap-1.5">
                                        {agent.tools.slice(0, 3).map(t => (
                                            <span key={t} className={`text-[10px] font-bold ${c.chip} rounded-full px-2.5 py-0.5`}>{t}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* ── HOW IT WORKS ─────────────────────────────── */}
                <section className="mb-24">
                    <div className="text-center mb-12">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3 block">How it works</span>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3">From answers to deployable agents in three steps</h2>
                    </div>

                    <div className="relative grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Connecting line */}
                        <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-blue-200 z-0" />

                        {[
                            { n: '01', icon: Zap,         title: 'Answer 5 questions',    body: 'Department priority, target outcomes, repetitive work, your stack, and pace. Roughly 5 minutes end-to-end.' },
                            { n: '02', icon: Sparkles,    title: 'Get your agent roster', body: 'We rank our 18-agent catalog against your answers and recommend a 2 / 4 / 6-agent build.' },
                            { n: '03', icon: ArrowRight,  title: 'Meet with an AI Expert',body: 'We scope the build, lock the launch order, and ship the first agent inside 30 days.' },
                        ].map((s, i) => (
                            <motion.div
                                key={s.n}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                viewport={{ once: true }}
                                className="relative z-10 bg-white rounded-3xl p-7 border border-slate-200/70 shadow-sm hover:shadow-md transition-all"
                            >
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-600/20">
                                        <s.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="text-[11px] font-black tracking-[0.2em] text-blue-600">STEP {s.n}</div>
                                </div>
                                <h3 className="font-black text-xl text-slate-900 mb-2 tracking-tight">{s.title}</h3>
                                <p className="text-sm text-slate-600 leading-relaxed">{s.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ── PACKAGES TEASER ──────────────────────────── */}
                <section className="mb-24">
                    <div className="text-center mb-10">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3 block">Three package sizes</span>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">2, 4, or 6 agents — sized to your reality</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { size: 2, label: 'Starter',    line: 'Two agents to prove the model and ship a quick win.' },
                            { size: 4, label: 'Growth',     line: 'Four agents covering your highest-friction departments.', recommended: true },
                            { size: 6, label: 'Enterprise', line: 'Full agent operating system across all five departments.' },
                        ].map(p => (
                            <div
                                key={p.size}
                                className={`relative rounded-3xl p-7 border-2 transition-all ${
                                    p.recommended
                                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 border-transparent shadow-2xl shadow-blue-600/30 text-white'
                                        : 'bg-white border-slate-200/70 hover:border-blue-200'
                                }`}
                            >
                                {p.recommended && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-md border border-blue-100">
                                        Most popular
                                    </div>
                                )}
                                <div className={`text-[10px] font-black uppercase tracking-widest mb-3 ${p.recommended ? 'text-blue-100' : 'text-blue-600'}`}>{p.label}</div>
                                <div className={`text-5xl font-black mb-1 tracking-tight tabular-nums ${p.recommended ? 'text-white' : 'text-slate-900'}`}>{p.size}</div>
                                <div className={`text-xs font-bold mb-4 ${p.recommended ? 'text-blue-100' : 'text-slate-500'}`}>custom AI agents</div>
                                <p className={`text-sm leading-relaxed ${p.recommended ? 'text-blue-50' : 'text-slate-600'}`}>{p.line}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-xs text-slate-500 mt-6 font-bold">Pricing is scoped on a free 30-minute call with an AI Expert after your assessment.</p>
                </section>

                {/* ── FINAL CTA ───────────────────────────────── */}
                <section>
                    <div className="relative rounded-[40px] overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 px-8 md:px-16 py-14 md:py-20 shadow-2xl shadow-blue-600/30">
                        {/* Subtle grid */}
                        <div
                            className="absolute inset-0 opacity-20 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.4) 1px, transparent 0)',
                                backgroundSize: '24px 24px',
                            }}
                        />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                            <div className="flex-1">
                                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">Ready to see your agent team?</h2>
                                <p className="text-sm md:text-base text-blue-100 max-w-md leading-relaxed">
                                    Five questions. No pricing on the result page. Talk to an AI Expert at the end if it's a fit.
                                </p>
                            </div>
                            <Link
                                href={signedIn ? "/ai-agents/assessment" : "/auth?next=/ai-agents/assessment"}
                                className="group inline-flex items-center justify-center gap-3 bg-white hover:bg-blue-50 text-blue-700 font-black uppercase tracking-widest text-sm px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.03] shrink-0"
                            >
                                <Sparkles className="h-4 w-4" />
                                Start the Assessment
                                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-200/60 bg-white/70 backdrop-blur mt-12">
                <div className="max-w-7xl mx-auto px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-bold text-slate-500">
                    <div>© Audcomp · AI Agent Assessment</div>
                    <div className="flex items-center gap-5">
                        <Link href="/ai-advisor" className="hover:text-slate-800 transition-colors">AI Audit</Link>
                        <Link href="/dashboard" className="hover:text-slate-800 transition-colors">Dashboard</Link>
                        <Link href="/select-expert" className="hover:text-slate-800 transition-colors">Choose an AI Expert</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
