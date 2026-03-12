'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BrainCircuit, Sparkles, FileText, Zap, Shield, BarChart3, TrendingUp, Bot, BookOpen,
    ArrowRight, CheckCircle2, Loader2, DollarSign, Clock, Users, Target, Rocket
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdvisorResponses } from '@/lib/advisor-questions';
import {
    generateRecommendations,
    generateRoadmap,
    generateRoiDefaults,
    Recommendation,
    RoadmapPhase,
    RoiDefaults,
} from '@/lib/advisor-engine';
import { createClient } from '@/lib/supabase/client';

const ICON_MAP: Record<string, React.ElementType> = {
    Sparkles, FileText, Zap, Shield, BarChart3, TrendingUp, Bot, BookOpen, BrainCircuit,
};

const PHASE_COLORS: Record<string, string> = {
    blue: 'bg-blue-600/10 border-blue-600/20 text-blue-600',
    indigo: 'bg-indigo-600/10 border-indigo-600/20 text-indigo-600',
    emerald: 'bg-emerald-600/10 border-emerald-600/20 text-emerald-600',
};

const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-blue-50 text-blue-600 border border-blue-100',
    medium: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
    low: 'bg-slate-50 text-slate-500 border border-slate-100',
};

export default function AdvisorResultsPage() {
    const [responses, setResponses] = useState<AdvisorResponses | null>(null);
    const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
    const [roadmap, setRoadmap] = useState<RoadmapPhase[]>([]);
    const [narrative, setNarrative] = useState<string>('');
    const [loadingNarrative, setLoadingNarrative] = useState(true);
    const [roiDefaults, setRoiDefaults] = useState<RoiDefaults | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // ROI Calculator state
    const [numUsers, setNumUsers] = useState(20);
    const [hourlyRate, setHourlyRate] = useState(55);
    const [timeSaved, setTimeSaved] = useState(10);
    const [annualCostPerUser, setAnnualCostPerUser] = useState(360);
    const [monthlyPages, setMonthlyPages] = useState(0);
    const [costPerPage, setCostPerPage] = useState(5);

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function init() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/auth');
                return;
            }
            setIsCheckingAuth(false);

            const stored = sessionStorage.getItem('advisor_responses');
            if (!stored) {
                router.push('/ai-advisor');
                return;
            }

            const parsed: AdvisorResponses = JSON.parse(stored);
            setResponses(parsed);

            const recs = generateRecommendations(parsed);
            const rm = generateRoadmap(parsed);
            const defaults = generateRoiDefaults(parsed);

            setRecommendations(recs);
            setRoadmap(rm);
            setRoiDefaults(defaults);
            setNumUsers(defaults.numUsers);
            setHourlyRate(defaults.hourlyRate);
            setTimeSaved(defaults.timeSavedPerMonth);
            setAnnualCostPerUser(defaults.annualCostPerUser);
            setMonthlyPages(defaults.monthlyPages);

            // Fetch Claude narrative
            try {
                const res = await fetch('/api/ai-advisor', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ responses: parsed }),
                });
                const data = await res.json();
                setNarrative(data.narrative || '');
            } catch {
                setNarrative('Based on your inputs, your business has strong AI adoption potential. Focus on quick wins first — automating your highest-volume manual processes — then scale systematically with the roadmap below.');
            } finally {
                setLoadingNarrative(false);
            }
        }
        init();
    }, []);

    // ROI Calculations
    const annualTimeSavedHours = timeSaved * 12 * numUsers;
    const annualValue = annualTimeSavedHours * hourlyRate;
    const annualLicenseCost = annualCostPerUser * numUsers;
    const annualUsageCost = monthlyPages > 0 ? (monthlyPages / 1000) * costPerPage * 12 : 0;
    const totalAnnualCost = annualLicenseCost + annualUsageCost;
    const roiPct = totalAnnualCost > 0 ? ((annualValue - totalAnnualCost) / totalAnnualCost) * 100 : 0;
    const paybackMonths = annualValue > 0 ? totalAnnualCost / (annualValue / 12) : 0;

    if (isCheckingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE]">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            {/* Header */}
            <header className="sticky top-0 z-50 flex w-full items-center justify-between px-8 py-5 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-8 w-auto brightness-0" />
                    </Link>
                    <span className="font-bold tracking-tight border-l border-slate-200 ml-2 pl-4 text-slate-400">
                        AI Adoption Advisor
                    </span>
                </div>
                <Link
                    href="/ai-advisor"
                    className="text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors"
                >
                    ← Retake Assessment
                </Link>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-12 space-y-16">

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-blue-600 border border-blue-100">
                        <BrainCircuit className="h-4 w-4" />
                        Your AI Adoption Roadmap
                    </div>
                    <h1 className="text-4xl font-black sm:text-5xl text-slate-900 mb-4 tracking-tight">
                        Here's Your Path to AI
                    </h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto">
                        Based on your environment, licensing, and business processes — here are your best AI opportunities.
                    </p>
                </motion.div>

                {/* AI Insight */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-600 p-8 text-white shadow-xl shadow-blue-600/20"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                            <Sparkles className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-widest text-blue-100">AI Insight</span>
                    </div>
                    {loadingNarrative ? (
                        <div className="flex items-center gap-3 text-blue-100">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="font-medium">Generating your personalized insight...</span>
                        </div>
                    ) : (
                        <p className="text-base leading-relaxed text-blue-50 font-medium">{narrative}</p>
                    )}
                </motion.div>

                {/* Recommendations */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-slate-900">Recommended AI Tools</h2>
                        <p className="text-slate-500 mt-1">Matched to your environment, licensing, and pain points.</p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-2">
                        {recommendations.map((rec, i) => {
                            const Icon = ICON_MAP[rec.icon] || BrainCircuit;
                            return (
                                <motion.div
                                    key={rec.tool}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + i * 0.05 }}
                                    className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-blue-200 transition-all"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/10">
                                            <Icon className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${PRIORITY_COLORS[rec.priority]}`}>
                                            {rec.priority} priority
                                        </span>
                                    </div>
                                    <h3 className="text-base font-black text-slate-900 mb-1">{rec.tool}</h3>
                                    <span className="inline-block mb-3 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-500">
                                        {rec.category}
                                    </span>
                                    <p className="text-sm text-slate-500 leading-relaxed mb-4">{rec.description}</p>
                                    <div className="flex items-center gap-2 border-t border-slate-50 pt-4">
                                        <DollarSign className="h-4 w-4 text-emerald-600 shrink-0" />
                                        <span className="text-sm font-bold text-slate-700">{rec.monthlyEstimate}</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </section>

                {/* Roadmap */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-slate-900">Your Implementation Roadmap</h2>
                        <p className="text-slate-500 mt-1">A phased approach to ensure lasting adoption without disruption.</p>
                    </div>
                    <div className="grid gap-5 sm:grid-cols-3">
                        {roadmap.map((phase, i) => (
                            <motion.div
                                key={phase.phase}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.1 }}
                                className="rounded-[24px] bg-white border border-slate-100 p-6 shadow-sm"
                            >
                                <div className={`mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-black uppercase tracking-wide ${PHASE_COLORS[phase.color]}`}>
                                    <Rocket className="h-3 w-3" />
                                    Phase {phase.phase}
                                </div>
                                <h3 className="text-lg font-black text-slate-900 mb-1">{phase.title}</h3>
                                <p className="text-xs font-bold text-slate-400 mb-5 uppercase tracking-wide">{phase.timeline}</p>
                                <ul className="space-y-3">
                                    {phase.items.map((item, j) => (
                                        <li key={j} className="flex items-start gap-3">
                                            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" />
                                            <span className="text-sm text-slate-600 font-medium leading-snug">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ROI Calculator */}
                <section>
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-slate-900">ROI Calculator</h2>
                        <p className="text-slate-500 mt-1">Adjust the inputs below to project your expected return.</p>
                    </div>
                    <div className="rounded-[32px] bg-white border border-slate-100 shadow-sm p-8">
                        <div className="grid gap-6 sm:grid-cols-2 mb-8">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Number of users adopting AI
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={numUsers}
                                    onChange={e => setNumUsers(Number(e.target.value))}
                                    className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Avg. hourly labour cost ($ CAD/USD)
                                </label>
                                <input
                                    type="number"
                                    min={10}
                                    value={hourlyRate}
                                    onChange={e => setHourlyRate(Number(e.target.value))}
                                    className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Hours saved per user per month: <span className="text-blue-600">{timeSaved}h</span>
                                </label>
                                <input
                                    type="range"
                                    min={1}
                                    max={30}
                                    value={timeSaved}
                                    onChange={e => setTimeSaved(Number(e.target.value))}
                                    className="w-full accent-blue-600"
                                />
                                <div className="flex justify-between text-xs text-slate-400 mt-1 font-bold">
                                    <span>1h</span><span>Benchmark: 9–20h</span><span>30h</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Annual AI tool cost per user ($)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    value={annualCostPerUser}
                                    onChange={e => setAnnualCostPerUser(Number(e.target.value))}
                                    className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all"
                                />
                            </div>

                            {roiDefaults?.monthlyPages && roiDefaults.monthlyPages > 0 ? (
                                <>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                            Pages processed / month
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={monthlyPages}
                                            onChange={e => setMonthlyPages(Number(e.target.value))}
                                            className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                            Cost per 1,000 pages ($)
                                        </label>
                                        <input
                                            type="number"
                                            min={0.5}
                                            step={0.5}
                                            value={costPerPage}
                                            onChange={e => setCostPerPage(Number(e.target.value))}
                                            className="w-full rounded-[16px] border border-slate-200 bg-slate-50 px-5 py-4 text-lg font-bold text-slate-900 outline-none focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all"
                                        />
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Results */}
                        <div className="grid gap-4 sm:grid-cols-4 mb-6">
                            {[
                                { label: 'Annual Value', value: `$${annualValue.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-emerald-600' },
                                { label: 'Annual AI Cost', value: `$${totalAnnualCost.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-blue-600' },
                                { label: 'ROI', value: `${roiPct.toFixed(0)}%`, icon: Target, color: 'text-indigo-600' },
                                { label: 'Payback Period', value: paybackMonths > 0 ? `${paybackMonths.toFixed(1)} mo` : '—', icon: Clock, color: 'text-slate-600' },
                            ].map(metric => {
                                const Icon = metric.icon;
                                return (
                                    <div key={metric.label} className="rounded-[20px] bg-slate-50 border border-slate-100 p-5 text-center">
                                        <Icon className={`h-5 w-5 mx-auto mb-2 ${metric.color}`} />
                                        <div className={`text-2xl font-black ${metric.color}`}>{metric.value}</div>
                                        <div className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">{metric.label}</div>
                                    </div>
                                );
                            })}
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-50 pt-5">
                            <strong className="text-slate-500">Note:</strong> These are projections based on industry benchmarks (Forrester/Microsoft studies show 9–20 hours saved/user/month). Actual ROI depends on adoption rate, training quality, and use case fit. Most SMBs see 3-year ROI of 130–350%.
                        </p>
                    </div>
                </section>

                {/* CTA */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-[32px] bg-[#050B1A] p-10 text-center text-white"
                >
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-600/10 border border-blue-500/20 px-4 py-1.5 text-sm font-black uppercase tracking-widest text-blue-400">
                        <Rocket className="h-4 w-4" />
                        Next Step
                    </div>
                    <h2 className="text-3xl font-black mb-4">Ready to make it real?</h2>
                    <p className="text-slate-400 mb-8 max-w-lg mx-auto leading-relaxed">
                        Get a full AI Readiness Audit with a detailed score, category breakdown, and a dedicated expert to guide your implementation.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/auth"
                            className="group flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-black text-white transition-all hover:bg-blue-700 hover:scale-105 shadow-xl shadow-blue-600/20"
                        >
                            Start Full AI Audit
                            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                            href="/dashboard"
                            className="rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-white transition-all hover:bg-white/10"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </motion.section>
            </main>
        </div>
    );
}
