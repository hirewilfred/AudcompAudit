'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowRight, Sparkles, Target, Database, MessageSquare, MessageCircle,
    Calendar, BookOpen, PenLine, Camera, CalendarDays, Search, Bot, ClipboardCheck,
    BarChart3, Users, FileText, Play, Zap,
} from 'lucide-react';
import { AGENT_CATALOG, AgentCatalogEntry } from '@/lib/agent-catalog';

const ICON_MAP: Record<string, React.ElementType> = {
    Sparkles, Target, Database, MessageSquare, MessageCircle, Calendar, BookOpen,
    PenLine, Camera, CalendarDays, Search, Bot, ClipboardCheck, BarChart3, Users, FileText,
};

const COLOR_MAP: Record<AgentCatalogEntry['color'], { glow: string; ring: string; iconBg: string; iconBorder: string; iconColor: string; name: string }> = {
    violet:  { glow: 'shadow-[0_0_60px_-10px_rgba(167,139,250,0.55)]', ring: 'ring-violet-400/40',  iconBg: 'bg-violet-500/15',  iconBorder: 'border-violet-400/40',  iconColor: 'text-violet-300',  name: 'violet'  },
    cyan:    { glow: 'shadow-[0_0_60px_-10px_rgba(34,211,238,0.55)]',  ring: 'ring-cyan-400/40',    iconBg: 'bg-cyan-500/15',    iconBorder: 'border-cyan-400/40',    iconColor: 'text-cyan-300',    name: 'cyan'    },
    emerald: { glow: 'shadow-[0_0_60px_-10px_rgba(52,211,153,0.55)]',  ring: 'ring-emerald-400/40', iconBg: 'bg-emerald-500/15', iconBorder: 'border-emerald-400/40', iconColor: 'text-emerald-300', name: 'emerald' },
    amber:   { glow: 'shadow-[0_0_60px_-10px_rgba(251,191,36,0.55)]',  ring: 'ring-amber-400/40',   iconBg: 'bg-amber-500/15',   iconBorder: 'border-amber-400/40',   iconColor: 'text-amber-300',   name: 'amber'   },
    rose:    { glow: 'shadow-[0_0_60px_-10px_rgba(251,113,133,0.55)]', ring: 'ring-rose-400/40',    iconBg: 'bg-rose-500/15',    iconBorder: 'border-rose-400/40',    iconColor: 'text-rose-300',    name: 'rose'    },
    sky:     { glow: 'shadow-[0_0_60px_-10px_rgba(56,189,248,0.55)]',  ring: 'ring-sky-400/40',     iconBg: 'bg-sky-500/15',     iconBorder: 'border-sky-400/40',     iconColor: 'text-sky-300',     name: 'sky'     },
    pink:    { glow: 'shadow-[0_0_60px_-10px_rgba(244,114,182,0.55)]', ring: 'ring-pink-400/40',    iconBg: 'bg-pink-500/15',    iconBorder: 'border-pink-400/40',    iconColor: 'text-pink-300',    name: 'pink'    },
    lime:    { glow: 'shadow-[0_0_60px_-10px_rgba(163,230,53,0.55)]',  ring: 'ring-lime-400/40',    iconBg: 'bg-lime-500/15',    iconBorder: 'border-lime-400/40',    iconColor: 'text-lime-300',    name: 'lime'    },
};

// Six representative agents for the hero gallery
const HERO_AGENTS = [
    'marketing-orchestrator',
    'lead-hunter',
    'lead-enricher',
    'outreach-strategist',
    'engagement-responder',
    'special-events-coord',
].map(id => AGENT_CATALOG.find(a => a.id === id)!).filter(Boolean);

export default function AIAgentsLandingPage() {
    return (
        <div className="min-h-screen bg-[#050B1A] text-white relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

            {/* Background glow */}
            <div className="fixed top-0 right-0 h-[700px] w-[700px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />

            {/* Constellation lines */}
            <svg className="fixed inset-0 w-full h-full opacity-30 pointer-events-none" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%"   stopColor="#a78bfa" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.6" />
                    </linearGradient>
                </defs>
                <line x1="5%"  y1="20%" x2="35%" y2="55%" stroke="url(#line-grad)" strokeWidth="0.5" />
                <line x1="35%" y1="55%" x2="70%" y2="30%" stroke="url(#line-grad)" strokeWidth="0.5" />
                <line x1="70%" y1="30%" x2="95%" y2="70%" stroke="url(#line-grad)" strokeWidth="0.5" />
                <line x1="20%" y1="80%" x2="55%" y2="60%" stroke="url(#line-grad)" strokeWidth="0.5" />
                <line x1="55%" y1="60%" x2="85%" y2="85%" stroke="url(#line-grad)" strokeWidth="0.5" />
            </svg>

            {/* Header */}
            <header className="relative z-10 px-8 py-5 flex items-center justify-between border-b border-white/5">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-black text-sm tracking-wide">Audcomp · AI Agents</span>
                </Link>
                <nav className="flex items-center gap-5 text-xs font-bold text-slate-400">
                    <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
                    <Link href="/ai-advisor" className="hover:text-white transition-colors">AI Audit</Link>
                    <Link
                        href="/ai-agents/assessment"
                        className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-black uppercase tracking-widest px-4 py-2 rounded-xl shadow-lg shadow-violet-500/30"
                    >
                        <Play className="h-3 w-3" /> Start Assessment
                    </Link>
                </nav>
            </header>

            <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-24">

                {/* Hero */}
                <section className="text-center mb-20">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">AI Agent Assessment · Free · 5 Minutes</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
                        Build the AI Agents
                        <br />
                        <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                            your business is missing.
                        </span>
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Five focused questions. We map your departments to the right agents — Lead Hunter, Marketing Orchestrator,
                        Engagement Responder, and more — and scope a 2, 4, or 6-agent build with one of our AI Experts.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/ai-agents/assessment"
                            className="group inline-flex items-center gap-3 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-black uppercase tracking-widest text-sm px-7 py-4 rounded-2xl shadow-xl shadow-violet-500/30 transition-all hover:scale-[1.03]"
                        >
                            <Sparkles className="h-4 w-4" />
                            Start AI Agent Assessment
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 font-black uppercase tracking-widest text-xs px-5 py-3 rounded-2xl transition-all"
                        >
                            View My Dashboard
                        </Link>
                    </div>
                </section>

                {/* Hero gallery — 6 neon agent cards */}
                <section className="mb-20">
                    <div className="text-center mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-300">Sample of the agent roster</span>
                    </div>
                    <h2 className="text-2xl font-black text-center mb-10 text-slate-200">Total Team Overview</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {HERO_AGENTS.map((agent, i) => {
                            const c = COLOR_MAP[agent.color];
                            const Icon = ICON_MAP[agent.icon] || Bot;
                            return (
                                <motion.div
                                    key={agent.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.08 }}
                                    viewport={{ once: true }}
                                    className={`relative rounded-3xl bg-[#0a1424]/80 backdrop-blur p-6 border border-white/10 ring-1 ${c.ring} ${c.glow} hover:scale-[1.02] transition-transform`}
                                >
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className={`h-14 w-14 rounded-2xl ${c.iconBg} border-2 ${c.iconBorder} flex items-center justify-center shrink-0`}>
                                            <Icon className={`h-6 w-6 ${c.iconColor}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-black text-lg text-white leading-tight">{agent.name}</h3>
                                            <p className="text-[11px] font-mono text-slate-500 mt-0.5">{agent.slug}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-black/30 rounded-xl border border-white/5 px-3 py-2">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Last Run</div>
                                            <div className="text-emerald-300 font-black text-sm">{agent.sampleStats.lastRunLabel}</div>
                                        </div>
                                        <div className="bg-black/30 rounded-xl border border-white/5 px-3 py-2">
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Success Rate</div>
                                            <div className="text-emerald-300 font-black text-sm">{agent.sampleStats.successRate}%</div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">{agent.description}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {agent.tools.slice(0, 3).map(t => (
                                            <span key={t} className="text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300 rounded-full px-2 py-0.5">{t}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* How it works */}
                <section className="mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-black text-white mb-3">How the Assessment Works</h2>
                        <p className="text-sm text-slate-400">From answers to deployable agents in three steps.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { n: '01', icon: Zap,      title: 'Answer 5 questions', body: 'Department priority, target outcomes, repetitive work, your stack, and pace. ~5 minutes.' },
                            { n: '02', icon: Sparkles, title: 'Get your agent roster', body: 'We rank our agent catalog against your answers and recommend the right 2 / 4 / 6-agent package.' },
                            { n: '03', icon: ArrowRight,title: 'Meet with an AI Expert', body: 'We scope the build, lock the launch order, and ship the first agent inside 30 days.' },
                        ].map(s => (
                            <div key={s.n} className="bg-white/3 backdrop-blur rounded-3xl p-6 border border-white/10">
                                <div className="text-[10px] font-black tracking-widest text-cyan-300 mb-3">{s.n}</div>
                                <s.icon className="h-6 w-6 text-violet-300 mb-3" />
                                <h3 className="font-black text-lg text-white mb-2">{s.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Final CTA */}
                <section className="text-center">
                    <div className="inline-block bg-gradient-to-br from-violet-600/20 to-cyan-600/20 border border-violet-400/30 rounded-3xl px-12 py-10 backdrop-blur">
                        <h2 className="text-3xl font-black text-white mb-3">Ready to see your agent team?</h2>
                        <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
                            Five questions. No pricing on the result page. Talk to an AI Expert at the end if it's a fit.
                        </p>
                        <Link
                            href="/ai-agents/assessment"
                            className="group inline-flex items-center gap-3 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white font-black uppercase tracking-widest text-sm px-7 py-4 rounded-2xl shadow-xl shadow-violet-500/30 transition-all hover:scale-[1.03]"
                        >
                            <Sparkles className="h-4 w-4" />
                            Start the Assessment
                            <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </section>

            </main>
        </div>
    );
}
