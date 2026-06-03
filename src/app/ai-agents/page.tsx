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
        <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">

            <SiteNav activeCta="agents" />

            <main className="relative z-10 max-w-[1024px] mx-auto px-6 pt-24 sm:pt-32 pb-24">

                {/* HERO — centered Apple style */}
                <section className="text-center mb-32 sm:mb-40">
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                        className="eyebrow mb-5"
                    >
                        AI Agent Assessment · Free · 5 minutes
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                        className="display display-tight text-[#1d1d1f] text-[44px] sm:text-[72px] lg:text-[88px] mb-7"
                    >
                        Build the AI agents your business is missing.
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="text-[19px] sm:text-[21px] text-[#6e6e73] max-w-2xl mx-auto mb-10 leading-[1.4] [text-wrap:balance]"
                    >
                        Five focused questions. We map your departments to the right agents — Lead Hunter, Marketing Orchestrator, and more — then scope a 2, 4, or 6-agent build.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
                        className="flex flex-wrap items-center justify-center gap-3"
                    >
                        <Link
                            href={signedIn ? "/ai-agents/assessment" : "/auth?next=/ai-agents/assessment"}
                            className="apple-pill apple-pill-primary"
                        >
                            Start the assessment
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="apple-pill apple-pill-ghost"
                        >
                            View my dashboard
                        </Link>
                    </motion.div>

                    <div className="mt-14 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[12px] text-[#6e6e73]">
                        <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.5} /> Built by Audcomp · 25+ years</div>
                        <div className="flex items-center gap-2"><Bot className="h-3.5 w-3.5" strokeWidth={1.5} /> 18+ agent templates ready</div>
                        <div className="flex items-center gap-2"><Zap className="h-3.5 w-3.5" strokeWidth={1.5} /> First agent shipped in 30 days</div>
                    </div>
                </section>

                {/* HERO GALLERY */}
                <section className="mb-32 sm:mb-40">
                    <div className="text-center mb-3 eyebrow">Sample of the agent roster</div>
                    <h2 className="display display-tight text-center text-[#1d1d1f] text-[36px] sm:text-[48px] mb-3">Total team overview.</h2>
                    <p className="text-[17px] text-[#6e6e73] text-center mb-14 max-w-xl mx-auto leading-[1.45]">A glimpse of the agents we&apos;ve already templated. Your assessment picks the ones you actually need.</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {HERO_AGENTS.map((agent, i) => {
                            const Icon = ICON_MAP[agent.icon] || Bot;
                            return (
                                <motion.div
                                    key={agent.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.06, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                    viewport={{ once: true, margin: '-15%' }}
                                    className="group lift relative rounded-[22px] bg-white p-7 border hairline overflow-hidden"
                                >
                                    <div className="flex items-start gap-4 mb-5">
                                        <div className="h-11 w-11 rounded-full bg-[#1d1d1f]/[0.04] flex items-center justify-center shrink-0">
                                            <Icon className="h-4 w-4 text-[#1d1d1f]" strokeWidth={1.5} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-semibold tracking-tight text-[17px] text-[#1d1d1f] leading-tight">{agent.name}</h3>
                                            <p className="text-[11px] font-mono text-[#86868b] mt-0.5">{agent.slug}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-[#f5f5f7] rounded-[12px] px-3 py-2.5">
                                            <div className="text-[10px] text-[#86868b] mb-0.5">Last run</div>
                                            <div className="text-[#1d1d1f] font-medium text-[13px] tabular-nums">{agent.sampleStats.lastRunLabel}</div>
                                        </div>
                                        <div className="bg-[#f5f5f7] rounded-[12px] px-3 py-2.5">
                                            <div className="text-[10px] text-[#86868b] mb-0.5">Success rate</div>
                                            <div className="text-[#1d1d1f] font-medium text-[13px] tabular-nums">{agent.sampleStats.successRate}%</div>
                                        </div>
                                    </div>

                                    <p className="text-[13px] text-[#6e6e73] leading-[1.5] line-clamp-2 mb-4">{agent.description}</p>

                                    <div className="flex flex-wrap gap-1.5">
                                        {agent.tools.slice(0, 3).map(t => (
                                            <span key={t} className="text-[11px] text-[#6e6e73] bg-[#1d1d1f]/[0.04] rounded-full px-2.5 py-0.5">{t}</span>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* HOW IT WORKS */}
                <section className="mb-32 sm:mb-40">
                    <div className="text-center mb-14">
                        <div className="eyebrow mb-3">How it works</div>
                        <h2 className="display display-tight text-[#1d1d1f] text-[36px] sm:text-[48px] [text-wrap:balance]">From answers to deployable agents — in three steps.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { n: '01', title: 'Answer 5 questions',    body: 'Department priority, target outcomes, repetitive work, your stack, and pace. Roughly 5 minutes end-to-end.' },
                            { n: '02', title: 'Get your agent roster', body: 'We rank our 18-agent catalog against your answers and recommend a 2 / 4 / 6-agent build.' },
                            { n: '03', title: 'Meet with an AI expert', body: 'We scope the build, lock the launch order, and ship the first agent inside 30 days.' },
                        ].map((s, i) => (
                            <motion.div
                                key={s.n}
                                initial={{ opacity: 0, y: 12 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                                viewport={{ once: true, margin: '-15%' }}
                                className="lift bg-white rounded-[22px] p-8 border hairline"
                            >
                                <div className="mb-6 flex items-baseline gap-3">
                                    <span className="text-[44px] font-semibold tracking-tight text-[#1d1d1f]" style={{ fontFeatureSettings: '"tnum"' }}>
                                        {s.n}
                                    </span>
                                    <span className="h-px flex-1 bg-[#1d1d1f]/8" />
                                </div>
                                <h3 className="font-semibold text-[20px] tracking-tight text-[#1d1d1f] mb-2">{s.title}</h3>
                                <p className="text-[15px] text-[#6e6e73] leading-[1.5]">{s.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* PACKAGES */}
                <section className="mb-32 sm:mb-40">
                    <div className="text-center mb-12">
                        <div className="eyebrow mb-3">Three package sizes</div>
                        <h2 className="display display-tight text-[#1d1d1f] text-[36px] sm:text-[48px]">2, 4, or 6 agents — sized to your reality.</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            { size: 2, label: 'Starter',    line: 'Two agents to prove the model and ship a quick win.' },
                            { size: 4, label: 'Growth',     line: 'Four agents covering your highest-friction departments.', recommended: true },
                            { size: 6, label: 'Enterprise', line: 'Full agent operating system across all five departments.' },
                        ].map(p => (
                            <div
                                key={p.size}
                                className={`relative rounded-[22px] p-8 transition-all ${
                                    p.recommended
                                        ? 'bg-[#1d1d1f] text-white'
                                        : 'bg-white border hairline'
                                }`}
                            >
                                {p.recommended && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-[#1d1d1f] text-[11px] font-medium px-3 py-1 rounded-full border hairline">
                                        Most popular
                                    </div>
                                )}
                                <div className={`text-[12px] mb-3 ${p.recommended ? 'text-white/60' : 'text-[#6e6e73]'}`}>{p.label}</div>
                                <div className={`display display-tight text-[72px] mb-1 tabular-nums ${p.recommended ? 'text-white' : 'text-[#1d1d1f]'}`}>{p.size}</div>
                                <div className={`text-[12px] mb-5 ${p.recommended ? 'text-white/60' : 'text-[#6e6e73]'}`}>custom AI agents</div>
                                <p className={`text-[14px] leading-[1.5] ${p.recommended ? 'text-white/85' : 'text-[#6e6e73]'}`}>{p.line}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-[13px] text-[#6e6e73] mt-6">Pricing is scoped on a free 30-minute call with an AI Expert after your assessment.</p>
                </section>

                {/* FINAL CTA */}
                <section className="text-center py-24 rounded-[32px] bg-[#f5f5f7]">
                    <h2 className="display display-tight text-[#1d1d1f] text-[36px] sm:text-[56px] mb-6 px-6 [text-wrap:balance]">Ready to see your agent team?</h2>
                    <p className="text-[17px] text-[#6e6e73] mb-10 max-w-md mx-auto leading-[1.45] px-6">
                        Five questions. No pricing on the result page. Talk to an AI Expert at the end if it&apos;s a fit.
                    </p>
                    <Link
                        href={signedIn ? "/ai-agents/assessment" : "/auth?next=/ai-agents/assessment"}
                        className="apple-pill apple-pill-primary"
                    >
                        Start the assessment
                        <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </section>

            </main>

            <footer className="border-t hairline bg-[#f5f5f7] py-10">
                <div className="mx-auto max-w-[1024px] px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[#6e6e73]">
                    <div>© Audcomp · AI Agent Assessment</div>
                    <div className="flex items-center gap-5">
                        <Link href="/ai-advisor" className="hover:text-[#1d1d1f] transition-colors">AI Audit</Link>
                        <Link href="/dashboard" className="hover:text-[#1d1d1f] transition-colors">Dashboard</Link>
                        <Link href="/select-expert" className="hover:text-[#1d1d1f] transition-colors">Choose an AI Expert</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
