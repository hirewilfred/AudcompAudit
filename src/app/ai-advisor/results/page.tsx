'use client';

import { Suspense } from 'react';
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
    buildPromptSummary
} from '@/lib/advisor-engine';
import { useSearchParams } from 'next/navigation';
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

function AdvisorResultsContent() {
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

    const searchParams = useSearchParams();
    const adminUserId = searchParams.get('userId');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        async function init() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/auth');
                return;
            }
            setIsCheckingAuth(false);

            let parsed: AdvisorResponses | null = null;
            let loadedNarrative = '';

            // If we have a userId, we are in admin mode or loading a saved report
            const searchOrg = searchParams.get('search');
            const userIdToLoad = adminUserId || session.user.id;

            try {
                // Try to fetch from DB first
                let query = supabase.from('ai_advisor_reports').select('*') as any;

                if (adminUserId) {
                    query = query.eq('user_id', adminUserId);
                } else if (searchOrg) {
                    // Look up the user_id from profiles.organization, then fetch their report
                    const { data: profileMatch } = await (supabase
                        .from('profiles')
                        .select('id')
                        .eq('organization', searchOrg)
                        .maybeSingle() as any);

                    if (profileMatch?.id) {
                        query = query.eq('user_id', profileMatch.id);
                    } else {
                        // No profile matched — nothing to show
                        setLoadingNarrative(false);
                        return;
                    }
                } else {
                    query = query.eq('user_id', session.user.id);
                }

                const { data: dbData } = await query.maybeSingle();

                if (dbData) {
                    parsed = dbData.responses;
                    loadedNarrative = dbData.narrative || '';
                    setRecommendations(
                        (dbData.recommendations && dbData.recommendations.length > 0)
                            ? dbData.recommendations
                            : (parsed ? generateRecommendations(parsed) : [])
                    );
                    setRoadmap(
                        (dbData.roadmap && dbData.roadmap.length > 0)
                            ? dbData.roadmap
                            : (parsed ? generateRoadmap(parsed) : [])
                    );
                    setResponses(parsed);

                    if (parsed) {
                        const defaults = generateRoiDefaults(parsed);
                        setRoiDefaults(defaults);
                        setNumUsers(dbData.roi_parameters?.numUsers ?? defaults.numUsers);
                        setHourlyRate(dbData.roi_parameters?.hourlyRate ?? defaults.hourlyRate);
                        setTimeSaved(dbData.roi_parameters?.timeSaved ?? defaults.timeSavedPerMonth);
                        setAnnualCostPerUser(dbData.roi_parameters?.annualCostPerUser ?? defaults.annualCostPerUser);
                        setMonthlyPages(defaults.monthlyPages);
                    }

                    // If narrative is missing, generate it on-the-fly
                    if (loadedNarrative) {
                        setNarrative(loadedNarrative);
                        setLoadingNarrative(false);
                    } else if (parsed) {
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
                    } else {
                        setLoadingNarrative(false);
                    }
                    return; // Exit early if loaded from DB
                }
            } catch (err) {
                console.error("Error loading from DB:", err);
            }

            // If admin userId but no ai_advisor_reports row, try the API which checks profiles.directors_notes
            if (adminUserId) {
                try {
                    const res = await fetch(`/api/ai-advisor?userId=${adminUserId}`);
                    if (res.ok) {
                        const apiData = await res.json();
                        if (apiData?.responses) {
                            parsed = apiData.responses;
                            const recs = (apiData.recommendations?.length > 0)
                                ? apiData.recommendations
                                : generateRecommendations(parsed!);
                            const rm = (apiData.roadmap?.length > 0)
                                ? apiData.roadmap
                                : generateRoadmap(parsed!);
                            const defaults = generateRoiDefaults(parsed!);
                            setRecommendations(recs);
                            setRoadmap(rm);
                            setResponses(parsed);
                            setRoiDefaults(defaults);
                            setNumUsers(defaults.numUsers);
                            setHourlyRate(defaults.hourlyRate);
                            setTimeSaved(defaults.timeSavedPerMonth);
                            setAnnualCostPerUser(defaults.annualCostPerUser);
                            setMonthlyPages(defaults.monthlyPages);
                            if (apiData.narrative) {
                                setNarrative(apiData.narrative);
                                setLoadingNarrative(false);
                            } else {
                                try {
                                    const nr = await fetch('/api/ai-advisor', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ responses: parsed }),
                                    });
                                    const nd = await nr.json();
                                    setNarrative(nd.narrative || '');
                                } catch {
                                    setNarrative('Based on your inputs, this business has strong AI adoption potential. Focus on quick wins first, then scale systematically.');
                                } finally {
                                    setLoadingNarrative(false);
                                }
                            }
                            return;
                        }
                    }
                } catch (err) {
                    console.error('Error loading from API fallback:', err);
                }
                // No data found for this admin userId at all
                setLoadingNarrative(false);
                return;
            }

            // Fallback to SessionStorage (for the generator flow)
            const stored = sessionStorage.getItem('advisor_responses');
            if (!stored && !adminUserId) {
                router.push('/ai-advisor');
                return;
            }

            if (stored) {
                parsed = JSON.parse(stored);
                setResponses(parsed);

                const recs = generateRecommendations(parsed!);
                const rm = generateRoadmap(parsed!);
                const defaults = generateRoiDefaults(parsed!);

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
                    loadedNarrative = data.narrative || '';
                    setNarrative(loadedNarrative);
                } catch {
                    loadedNarrative = 'Based on your inputs, your business has strong AI adoption potential. Focus on quick wins first — automating your highest-volume manual processes — then scale systematically with the roadmap below.';
                    setNarrative(loadedNarrative);
                } finally {
                    setLoadingNarrative(false);
                }

                // If this is the user's own session, save it automatically
                if (parsed && !adminUserId) {
                    try {
                        await fetch('/api/ai-advisor/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                responses: parsed,
                                narrative: loadedNarrative,
                                recommendations: recs,
                                roadmap: rm,
                                annualCostPerUser: defaults.annualCostPerUser,
                                numUsers: defaults.numUsers,
                                hourlyRate: defaults.hourlyRate,
                                timeSaved: defaults.timeSavedPerMonth
                            })
                        });
                    } catch (err) {
                        console.error("Failed to save report:", err);
                    }
                }
            }
        }
        init();
    }, [adminUserId]);

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
        <div id="ai-advisor-print" className="min-h-screen bg-[#F4F7FE] text-slate-800">
            {/* Header */}
            <header className="no-print sticky top-0 z-50 flex w-full items-center justify-between px-8 py-5 bg-white shadow-sm border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-8 w-auto brightness-0" />
                    </Link>
                    <span className="font-bold tracking-tight border-l border-slate-200 ml-2 pl-4 text-slate-400">
                        AI Adoption Advisor
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    {adminUserId && (
                        <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100">
                            Admin View Mode
                        </div>
                    )}
                    <Link
                        href={adminUserId ? "/admin" : "/dashboard"}
                        className="text-sm font-black text-slate-900 bg-slate-100 hover:bg-slate-200 px-6 py-2 rounded-full transition-all active:scale-95"
                    >
                        {adminUserId ? "Back to Admin" : "Back to Dashboard"}
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-6 py-12 space-y-12">
                
                {/* Hero / Report Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div>
                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1 text-xs font-black uppercase tracking-widest text-blue-600 border border-blue-100">
                            <Sparkles className="h-3 w-3" />
                            AI Strategy Report
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            Strategic AI Roadmap
                        </h1>
                    </div>
                    <div className="no-print flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 rounded-2xl bg-white border border-slate-200 px-6 py-3 text-sm font-black text-slate-900 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <FileText className="h-4 w-4" /> Export PDF
                        </button>
                    </div>
                </motion.div>

                {/* Personalized Strategic Insight */}
                <section className="bg-white rounded-[40px] p-8 md:p-12 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                        <Sparkles className="h-64 w-64 text-blue-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                <BrainCircuit className="h-6 w-6" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight underline decoration-blue-500/30 underline-offset-8">Executive Summary</h2>
                        </div>

                        {loadingNarrative ? (
                            <div className="flex items-center gap-3 text-slate-400 font-bold py-4">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating personalized roadmap...
                            </div>
                        ) : (
                            <div className="prose prose-slate max-w-none prose-p:text-lg prose-p:font-medium prose-p:text-slate-600 prose-p:leading-relaxed">
                                <p>{narrative}</p>
                            </div>
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left Column: Recommendations & Roadmap */}
                    <div className="lg:col-span-8 space-y-8">
                        
                        {/* Recommendations */}
                        <section className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-slate-100">
                            <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-6">
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <Target className="h-5 w-5 text-blue-600" /> Tool Recommendations
                                </h3>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                                    {recommendations.length} Suggestions
                                </span>
                            </div>
                            
                            <div className="grid gap-6">
                                {recommendations.map((rec, i) => {
                                    const Icon = ICON_MAP[rec.icon] || Zap;
                                    return (
                                        <div key={i} className="group flex items-start gap-6 p-6 rounded-[32px] border border-slate-50 hover:bg-slate-50/50 transition-all duration-300">
                                            <div className="h-14 w-14 rounded-2xl bg-slate-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                                                <Icon className="h-7 w-7" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                    <h4 className="text-lg font-black text-slate-900">{rec.tool}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm ${PRIORITY_COLORS[rec.priority]}`}>
                                                            {rec.priority} Priority
                                                        </span>
                                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                                            {rec.monthlyEstimate}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-medium text-slate-500 leading-relaxed mb-4">{rec.description}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {rec.tags.map(tag => (
                                                        <span key={tag} className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full hover:bg-slate-200 transition-colors">#{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Roadmap */}
                        <section className="bg-white rounded-[40px] p-8 md:p-10 shadow-sm border border-slate-100">
                            <h3 className="text-xl font-black mb-10 flex items-center gap-2 text-slate-900 border-b border-slate-50 pb-6">
                                <Rocket className="h-5 w-5 text-indigo-600" /> Implementation Roadmap
                            </h3>
                            <div className="space-y-12">
                                {roadmap.map((phase, i) => (
                                    <div key={i} className="relative pl-16">
                                        {i < roadmap.length - 1 && (
                                            <div className="absolute left-[27px] top-14 bottom-[-48px] w-0.5 bg-slate-100" />
                                        )}
                                        <div className={`absolute left-0 top-0 h-14 w-14 rounded-3xl flex items-center justify-center font-black text-lg shadow-sm ${PHASE_COLORS[phase.color]}`}>
                                            {phase.phase}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <h4 className="text-2xl font-black text-slate-900 tracking-tight">{phase.title}</h4>
                                                <span className="text-xs font-black text-slate-400 bg-slate-50 px-4 py-1.5 rounded-[12px] uppercase tracking-widest border border-slate-100">{phase.timeline}</span>
                                            </div>
                                            <div className="grid gap-3">
                                                {phase.items.map((item, j) => (
                                                    <div key={j} className="flex items-center gap-3 p-4 rounded-2xl border border-slate-50 bg-slate-50/50 hover:bg-white hover:shadow-sm transition-all font-bold text-slate-700 text-sm">
                                                        <CheckCircle2 className={`h-5 w-5 shrink-0 text-blue-500/50`} />
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: ROI & CTA */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* ROI Calculator */}
                        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 sticky top-32">
                            <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-4">
                                <BarChart3 className="h-6 w-6 text-emerald-600" />
                                <h3 className="text-xl font-black text-slate-900">ROI Calculator</h3>
                            </div>

                            <div className="bg-emerald-50 text-[10px] font-bold text-emerald-700 p-3 rounded-2xl border border-emerald-100/50 mb-8 flex items-center gap-2">
                                <Sparkles className="h-3 w-3" />
                                <span>Note: Values pre-filled based on your industry and identified pain points.</span>
                            </div>
                            
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                            <span>Staff Size</span>
                                            <span className="text-blue-600">{numUsers} People</span>
                                        </div>
                                        <input
                                            type="range" min="5" max="250" step="5"
                                            value={numUsers}
                                            onChange={e => setNumUsers(Number(e.target.value))}
                                            className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                            <span>Hourly Rate</span>
                                            <span className="text-blue-600">${hourlyRate}/hr</span>
                                        </div>
                                        <input
                                            type="range" min="20" max="200" step="5"
                                            value={hourlyRate}
                                            onChange={e => setHourlyRate(Number(e.target.value))}
                                            className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between mb-3 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                            <span>Time Saved / User</span>
                                            <span className="text-blue-600">{timeSaved}h/mo</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="30"
                                            value={timeSaved}
                                            onChange={e => setTimeSaved(Number(e.target.value))}
                                            className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>
                                </div>

                                <div className="p-6 rounded-[32px] bg-[#F8FAFF] border border-blue-50 space-y-4">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Annual Value</span>
                                        <span className="text-2xl font-black text-slate-900">${Math.round(annualValue).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Investment</span>
                                        <span className="text-lg font-black text-slate-400">${Math.round(totalAnnualCost).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 flex justify-between items-baseline">
                                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Net ROI</span>
                                        <div className="text-right">
                                            <span className="text-3xl font-black text-blue-600">+{roiPct.toFixed(0)}%</span>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Projected Annual Return</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Next Steps</h4>
                                    <Link
                                        href="/dashboard"
                                        className="group flex w-full items-center justify-center gap-3 rounded-[24px] bg-slate-900 border border-slate-900 px-6 py-5 text-sm font-black text-white transition-all hover:bg-blue-600 hover:border-blue-600 hover:scale-[1.02] shadow-xl shadow-slate-900/10 active:scale-95"
                                    >
                                        Visit User Dashboard
                                        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                    {!adminUserId && (
                                        <Link
                                            href="/ai-advisor"
                                            className="block w-full text-center text-xs font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                        >
                                            Retake Assessment
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </section>

                        <div className="p-8 rounded-[32px] bg-slate-900 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Target className="h-16 w-16" />
                            </div>
                            <h4 className="text-lg font-black mb-2 relative z-10">Need an Expert?</h4>
                            <p className="text-sm font-medium text-slate-400 mb-6 relative z-10">
                                Get a dedicated session to review this roadmap and validate these savings.
                            </p>
                            <Link 
                                href="/dashboard"
                                className="inline-flex items-center gap-2 text-sm font-black text-blue-400 hover:text-blue-300 transition-colors relative z-10"
                            >
                                Book Strategy Session <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}

export default function AdvisorResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE]">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        }>
            <AdvisorResultsContent />
        </Suspense>
    );
}
