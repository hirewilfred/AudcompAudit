'use client';

import { Suspense } from 'react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BrainCircuit, Sparkles, FileText, Zap, Shield, BarChart3, TrendingUp, Bot, BookOpen,
    ArrowRight, CheckCircle2, Loader2, DollarSign, Clock, Users, Target, Rocket,
    GraduationCap, Wrench, Calendar, Download, ChevronDown
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
    Sparkles, FileText, Zap, Shield, BarChart3, TrendingUp, Bot, BookOpen, BrainCircuit, Target, Users,
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

const SERVICES = [
    {
        icon: Users,
        label: 'Consulting & Strategy',
        description: 'Deep-dive sessions, customized roadmap, and hands-on implementation support.',
        tiers: [
            { label: 'Free Discovery Call', price: 'Free — 30 min' },
            { label: 'Strategy Session', price: '$500–$1,200 CAD' },
            { label: 'Full Project', price: '$3,000–$12,000 CAD' },
        ],
        cta: 'Book Free Discovery Call',
        accent: 'blue',
    },
    {
        icon: Bot,
        label: 'Custom AI Agent Build',
        description: 'We build, test, and deploy custom AI agents tailored to your workflows.',
        tiers: [
            { label: 'Starter Agent', price: '$1,497–$3,500 CAD' },
            { label: 'Standard Agent', price: '$4,000–$9,000 CAD' },
            { label: 'Advanced / Multi-Agent', price: '$10,000+ CAD' },
        ],
        cta: 'Request Agent Quote',
        accent: 'indigo',
    },
    {
        icon: GraduationCap,
        label: 'Training & Workshops',
        description: 'Hands-on AI training for teams and individuals — virtual or in-person.',
        tiers: [
            { label: 'Group Workshop', price: '$149–$299/person' },
            { label: 'Private Company Session', price: '$1,500–$6,000 CAD' },
            { label: 'Self-Paced Course', price: '$199–$499 CAD' },
        ],
        cta: 'View Training Options',
        accent: 'emerald',
    },
    {
        icon: Wrench,
        label: 'Ongoing Maintenance',
        description: 'Monthly monitoring, updates, and performance optimization of your AI stack.',
        tiers: [
            { label: 'Basic Retainer', price: '$250–$500/mo' },
            { label: 'Standard Retainer', price: '$600–$1,200/mo' },
            { label: 'Premium / Dedicated', price: '$1,500+/mo' },
        ],
        cta: 'See Maintenance Plans',
        accent: 'amber',
    },
] as const;

const SERVICE_ACCENT: Record<string, { card: string; icon: string; btn: string }> = {
    blue:    { card: 'border-blue-100/50',    icon: 'bg-blue-50 text-blue-600 border-blue-100',    btn: 'bg-blue-600 hover:bg-blue-700 text-white' },
    indigo:  { card: 'border-indigo-100/50',  icon: 'bg-indigo-50 text-indigo-600 border-indigo-100', btn: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
    emerald: { card: 'border-emerald-100/50', icon: 'bg-emerald-50 text-emerald-600 border-emerald-100', btn: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    amber:   { card: 'border-amber-100/50',   icon: 'bg-amber-50 text-amber-600 border-amber-100',  btn: 'bg-amber-500 hover:bg-amber-600 text-white' },
};

// Gradient card styles for recommendations — matches dashboard bento cards
const REC_CARD_STYLES: Record<string, { card: string; iconColor: string; pattern: string }> = {
    'Productivity':         { card: 'bg-gradient-to-br from-blue-50 to-white text-blue-900 border-blue-100/50',     iconColor: 'text-blue-500',    pattern: 'radial-gradient(circle at 2px 2px, #bfdbfe 1px, transparent 0)' },
    'Sales AI':             { card: 'bg-gradient-to-br from-indigo-50 to-white text-indigo-900 border-indigo-100/50', iconColor: 'text-indigo-500',  pattern: 'radial-gradient(circle at 2px 2px, #c7d2fe 1px, transparent 0)' },
    'Finance AI':           { card: 'bg-gradient-to-br from-emerald-50 to-white text-emerald-900 border-emerald-100/50', iconColor: 'text-emerald-500', pattern: 'radial-gradient(circle at 2px 2px, #a7f3d0 1px, transparent 0)' },
    'Document Automation':  { card: 'bg-gradient-to-br from-amber-50 to-white text-amber-900 border-amber-100/50',  iconColor: 'text-amber-500',   pattern: 'radial-gradient(circle at 2px 2px, #fde68a 1px, transparent 0)' },
    'Process Automation':   { card: 'bg-gradient-to-br from-violet-50 to-white text-violet-900 border-violet-100/50', iconColor: 'text-violet-500', pattern: 'radial-gradient(circle at 2px 2px, #ddd6fe 1px, transparent 0)' },
    'Customer Service':     { card: 'bg-gradient-to-br from-orange-50 to-white text-orange-900 border-orange-100/50', iconColor: 'text-orange-500', pattern: 'radial-gradient(circle at 2px 2px, #fed7aa 1px, transparent 0)' },
    'Data Governance':      { card: 'bg-gradient-to-br from-slate-100 to-white text-slate-900 border-slate-200/50', iconColor: 'text-slate-600',   pattern: 'radial-gradient(circle at 2px 2px, #cbd5e1 1px, transparent 0)' },
    'Knowledge Management': { card: 'bg-gradient-to-br from-purple-50 to-white text-purple-900 border-purple-100/50', iconColor: 'text-purple-500', pattern: 'radial-gradient(circle at 2px 2px, #e9d5ff 1px, transparent 0)' },
    'Healthcare AI':        { card: 'bg-gradient-to-br from-rose-50 to-white text-rose-900 border-rose-100/50',     iconColor: 'text-rose-500',    pattern: 'radial-gradient(circle at 2px 2px, #fecdd3 1px, transparent 0)' },
    'Operations AI':        { card: 'bg-gradient-to-br from-cyan-50 to-white text-cyan-900 border-cyan-100/50',     iconColor: 'text-cyan-500',    pattern: 'radial-gradient(circle at 2px 2px, #a5f3fc 1px, transparent 0)' },
    'Retail AI':            { card: 'bg-gradient-to-br from-pink-50 to-white text-pink-900 border-pink-100/50',     iconColor: 'text-pink-500',    pattern: 'radial-gradient(circle at 2px 2px, #fbcfe8 1px, transparent 0)' },
    'Real Estate AI':       { card: 'bg-gradient-to-br from-teal-50 to-white text-teal-900 border-teal-100/50',     iconColor: 'text-teal-500',    pattern: 'radial-gradient(circle at 2px 2px, #99f6e4 1px, transparent 0)' },
    'HR AI':                { card: 'bg-gradient-to-br from-lime-50 to-white text-lime-900 border-lime-100/50',     iconColor: 'text-lime-600',    pattern: 'radial-gradient(circle at 2px 2px, #d9f99d 1px, transparent 0)' },
    'IT Support AI':        { card: 'bg-gradient-to-br from-sky-50 to-white text-sky-900 border-sky-100/50',        iconColor: 'text-sky-500',     pattern: 'radial-gradient(circle at 2px 2px, #bae6fd 1px, transparent 0)' },
    'Communication AI':     { card: 'bg-gradient-to-br from-blue-50 to-white text-blue-900 border-blue-100/50',     iconColor: 'text-blue-500',    pattern: 'radial-gradient(circle at 2px 2px, #bfdbfe 1px, transparent 0)' },
    'Custom AI':            { card: 'bg-gradient-to-br from-indigo-100 to-white text-indigo-900 border-indigo-200/50', iconColor: 'text-indigo-600', pattern: 'radial-gradient(circle at 2px 2px, #a5b4fc 1px, transparent 0)' },
    'Business Intelligence':{ card: 'bg-gradient-to-br from-emerald-50 to-white text-emerald-900 border-emerald-100/50', iconColor: 'text-emerald-500', pattern: 'radial-gradient(circle at 2px 2px, #a7f3d0 1px, transparent 0)' },
    'Strategy':             { card: 'bg-gradient-to-br from-blue-50 to-white text-blue-900 border-blue-100/50',     iconColor: 'text-blue-500',    pattern: 'radial-gradient(circle at 2px 2px, #bfdbfe 1px, transparent 0)' },
    'default':              { card: 'bg-gradient-to-br from-slate-50 to-white text-slate-900 border-slate-100/50',  iconColor: 'text-slate-500',   pattern: 'radial-gradient(circle at 2px 2px, #e2e8f0 1px, transparent 0)' },
};

const SVC_PATTERNS = [
    'radial-gradient(circle at 2px 2px, #bfdbfe 1px, transparent 0)',
    'radial-gradient(circle at 2px 2px, #c7d2fe 1px, transparent 0)',
    'radial-gradient(circle at 2px 2px, #a7f3d0 1px, transparent 0)',
    'radial-gradient(circle at 2px 2px, #fde68a 1px, transparent 0)',
];

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

    const [sowCompany, setSowCompany] = useState('');
    const [sowRole, setSowRole] = useState('');
    const [showSow, setShowSow] = useState(false);

    const printSow = () => {
        document.body.classList.add('printing-sow');
        const cleanup = () => {
            document.body.classList.remove('printing-sow');
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        window.print();
    };

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

            const searchOrg = searchParams.get('search');

            // Admin view: always use server-side API (bypasses RLS)
            if (adminUserId) {
                try {
                    const res = await fetch(`/api/ai-advisor/save?userId=${adminUserId}`);
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
                            setNumUsers(apiData.roi_parameters?.numUsers ?? defaults.numUsers);
                            setHourlyRate(apiData.roi_parameters?.hourlyRate ?? defaults.hourlyRate);
                            setTimeSaved(apiData.roi_parameters?.timeSaved ?? defaults.timeSavedPerMonth);
                            setAnnualCostPerUser(apiData.roi_parameters?.annualCostPerUser ?? defaults.annualCostPerUser);
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
                    console.error('Admin API load failed:', err);
                }
                setLoadingNarrative(false);
                return;
            }

            try {
                // Non-admin: fetch own report from DB
                let query = supabase.from('ai_advisor_reports').select('*') as any;

                if (searchOrg) {
                    // Look up the user_id from profiles.organization, then fetch their report
                    const { data: profileMatch } = await (supabase
                        .from('profiles')
                        .select('id')
                        .eq('organization', searchOrg)
                        .maybeSingle() as any);

                    if (profileMatch?.id) {
                        query = query.eq('user_id', profileMatch.id);
                    } else {
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
        <div id="ai-advisor-print" className="min-h-screen bg-[#F4F7FE] text-slate-800 selection:bg-blue-600/10">
            {/* Background Accent */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[120px]" />
            </div>

            {/* Header */}
            <header className="no-print sticky top-0 z-50 flex w-full items-center justify-between px-10 py-6 bg-white/80 backdrop-blur-xl border-b border-slate-100">
                <div className="flex items-center gap-12">
                    <Link href="/">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-9 w-auto brightness-0" />
                    </Link>
                    <nav className="hidden lg:flex items-center gap-2">
                        <span className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-black shadow-lg shadow-slate-900/10">
                            AI Advisor Report
                        </span>
                        {adminUserId && (
                            <div className="px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-[10px] font-black uppercase tracking-widest border border-amber-100">
                                Admin View Mode
                            </div>
                        )}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href={adminUserId ? "/admin" : "/dashboard"}
                        className="px-6 py-2.5 rounded-full bg-white border border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-100 text-sm font-black transition-all"
                    >
                        {adminUserId ? "Back to Admin" : "Back to Dashboard"}
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-10 pt-12 pb-24 relative z-10">
                
                {/* Page Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6"
                >
                    <div>
                        <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-3">AI Strategy Report</h2>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Strategic AI Roadmap</h1>
                    </div>
                    <div className="no-print flex items-center gap-3">
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white border border-slate-100 text-slate-500 hover:text-blue-600 hover:border-blue-100 text-sm font-black transition-all"
                        >
                            <FileText className="h-4 w-4" /> Export PDF
                        </button>
                    </div>
                </motion.div>

                {/* Executive Summary */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 bg-white rounded-[48px] p-10 md:p-12 shadow-sm border border-slate-100/50 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                        <BrainCircuit className="h-64 w-64" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                <BrainCircuit className="h-5 w-5" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tight text-slate-900">Executive Summary</h2>
                        </div>
                        {loadingNarrative ? (
                            <div className="flex items-center gap-3 text-slate-400 font-bold py-4">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Generating your personalized AI roadmap...
                            </div>
                        ) : (
                            <p className="text-lg font-medium text-slate-600 leading-relaxed max-w-4xl">{narrative}</p>
                        )}
                    </div>
                </motion.section>

                {/* Bento Grid */}
                <div className="grid grid-cols-12 gap-8">

                    {/* Left: Recommendations + Roadmap */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">

                        {/* Tool Recommendations */}
                        <section className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100/50">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900">AI Tool Recommendations</h2>
                                </div>
                                <span className="text-slate-400 text-sm font-black uppercase tracking-widest">{recommendations.length} Tools</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {recommendations.map((rec, i) => {
                                    const Icon = ICON_MAP[rec.icon] || Zap;
                                    const style = REC_CARD_STYLES[rec.category] || REC_CARD_STYLES['default'];
                                    return (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.08 }}
                                            className={`${style.card} rounded-[40px] p-7 flex flex-col justify-between min-h-[240px] border-2 relative overflow-hidden group hover:scale-[1.03] transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-blue-900/10`}
                                        >
                                            <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: style.pattern, backgroundSize: '24px 24px' }} />
                                            <div className="absolute top-0 right-0 -mr-4 -mt-4 h-28 w-28 bg-current opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.07] transition-opacity" />
                                            <div className="relative z-10">
                                                <div className="flex items-start justify-between mb-5">
                                                    <div className="h-11 w-11 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                        <Icon className={`h-5 w-5 ${style.iconColor}`} />
                                                    </div>
                                                    <div className="bg-white/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.12em] border border-black/5 opacity-70">
                                                        {rec.category}
                                                    </div>
                                                </div>
                                                <h3 className="text-[15px] font-black leading-tight mb-2">{rec.tool}</h3>
                                                <p className="text-[11px] font-bold leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity line-clamp-3">{rec.description}</p>
                                            </div>
                                            <div className="mt-6 flex items-center justify-between relative z-10">
                                                <span className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-3 py-1.5 rounded-full group-hover:bg-blue-600 transition-colors shadow-md shadow-slate-900/10 group-hover:shadow-blue-600/20">
                                                    {rec.monthlyEstimate}
                                                </span>
                                                <div className="h-8 w-8 rounded-full border-2 border-slate-900/5 flex items-center justify-center -rotate-45 group-hover:rotate-0 group-hover:border-blue-600 group-hover:text-blue-600 transition-all bg-white/50 backdrop-blur-sm">
                                                    <ArrowRight className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Implementation Roadmap */}
                        <section className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100/50">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                        <Rocket className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Implementation Roadmap</h2>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100">
                                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Active Phase</span>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute left-6 top-0 bottom-0 w-[2px] bg-slate-100" />
                                <div className="space-y-10 relative">
                                    {roadmap.map((phase, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex gap-8 group"
                                        >
                                            <div className="relative z-10 shrink-0">
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-base shadow-lg transition-all duration-500 ${
                                                    i === 0 ? 'bg-blue-600 text-white shadow-blue-600/20'
                                                    : i === 1 ? 'bg-indigo-600 text-white shadow-indigo-600/30 scale-105 ring-4 ring-indigo-50'
                                                    : 'bg-slate-50 text-slate-400 border border-slate-100 group-hover:bg-slate-100 group-hover:text-slate-600'
                                                }`}>
                                                    0{phase.phase}
                                                </div>
                                            </div>
                                            <div className="flex-1 pt-1 pb-8">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                                                    <h3 className={`text-sm font-black uppercase tracking-widest ${i === 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                        Phase 0{phase.phase}: {phase.title}
                                                    </h3>
                                                    <span className={`self-start text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                                                        i === 0 ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : i === 1 ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                        : 'bg-slate-50 text-slate-400 border-slate-100'
                                                    }`}>
                                                        {phase.timeline}
                                                    </span>
                                                </div>
                                                <div className="space-y-2.5">
                                                    {phase.items.map((item, j) => (
                                                        <div key={j} className="flex items-start gap-3 text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">
                                                            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right: ROI + CTA */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        <section className="bg-white rounded-[48px] p-8 shadow-sm border border-slate-100/50 sticky top-32">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100/50">
                                <div className="h-10 w-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                    <BarChart3 className="h-5 w-5" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">ROI Calculator</h3>
                            </div>
                            <div className="bg-emerald-50 text-[10px] font-bold text-emerald-700 p-3 rounded-2xl border border-emerald-100/50 mb-6 flex items-center gap-2">
                                <Sparkles className="h-3 w-3 shrink-0" />
                                Pre-filled based on your industry & pain points
                            </div>
                            <div className="space-y-5">
                                {[
                                    { label: 'Staff Size', value: `${numUsers} People`, min: 5, max: 250, step: 5, state: numUsers, setter: setNumUsers },
                                    { label: 'Hourly Rate', value: `$${hourlyRate}/hr`, min: 20, max: 200, step: 5, state: hourlyRate, setter: setHourlyRate },
                                    { label: 'Time Saved / User', value: `${timeSaved}h/mo`, min: 1, max: 30, step: 1, state: timeSaved, setter: setTimeSaved },
                                ].map(s => (
                                    <div key={s.label}>
                                        <div className="flex justify-between mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                            <span>{s.label}</span>
                                            <span className="text-blue-600">{s.value}</span>
                                        </div>
                                        <input
                                            type="range" min={s.min} max={s.max} step={s.step}
                                            value={s.state}
                                            onChange={e => s.setter(Number(e.target.value))}
                                            className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer"
                                        />
                                    </div>
                                ))}
                                <div className="p-6 rounded-[32px] bg-[#F8FAFF] border border-blue-50 space-y-4">
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Annual Value</span>
                                        <span className="text-2xl font-black text-slate-900">${Math.round(annualValue).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-baseline">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Est. Investment</span>
                                        <span className="text-lg font-black text-slate-400">${Math.round(totalAnnualCost).toLocaleString()}</span>
                                    </div>
                                    <div className="pt-4 border-t border-blue-100 flex justify-between items-baseline">
                                        <span className="text-xs font-black text-blue-600 uppercase tracking-widest">Net ROI</span>
                                        <div className="text-right">
                                            <span className="text-3xl font-black text-blue-600">+{roiPct.toFixed(0)}%</span>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Annual Return</p>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href="/dashboard"
                                    className="group w-full bg-slate-900 text-white font-black py-5 px-6 rounded-[28px] shadow-xl shadow-slate-900/20 hover:bg-blue-600 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Zap className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                    Capture These Savings
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
                        </section>

                        <div className="p-8 rounded-[48px] bg-slate-900 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                                <Target className="h-20 w-20" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center">
                                        <Users className="h-4 w-4 text-white" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Expert Review</span>
                                </div>
                                <h4 className="text-xl font-black mb-2">Ready to take the next step?</h4>
                                <p className="text-sm font-medium text-slate-400 mb-6">
                                    Book a dedicated strategy session to review this roadmap with an AI expert and validate your ROI numbers.
                                </p>
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center gap-2 text-[11px] font-black text-white bg-blue-600 px-5 py-2.5 rounded-full hover:bg-blue-500 transition-colors"
                                >
                                    Book Strategy Session <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Services & Packages */}
                {recommendations.length > 0 && (
                    <>
                        <section className="mt-12 bg-white rounded-[48px] p-10 shadow-sm border border-slate-100/50 no-print">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <Users className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Services & Packages</h2>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">All prices in CAD + taxes</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                                {SERVICES.map((svc, idx) => {
                                    const Icon = svc.icon;
                                    const a = SERVICE_ACCENT[svc.accent];
                                    const pattern = SVC_PATTERNS[idx % SVC_PATTERNS.length];
                                    return (
                                        <motion.div
                                            key={svc.label}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={`rounded-[40px] p-7 flex flex-col gap-5 border-2 relative overflow-hidden group hover:scale-[1.03] transition-all duration-500 shadow-sm hover:shadow-xl hover:shadow-blue-900/10 bg-white ${a.card}`}
                                        >
                                            <div className="absolute inset-0 opacity-[0.3]" style={{ backgroundImage: pattern, backgroundSize: '24px 24px' }} />
                                            <div className="relative z-10">
                                                <div className={`h-11 w-11 rounded-2xl flex items-center justify-center border bg-white shadow-sm ${a.icon}`}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                            </div>
                                            <div className="relative z-10">
                                                <h3 className="font-black text-slate-900 text-[15px] mb-1">{svc.label}</h3>
                                                <p className="text-[11px] font-medium text-slate-500 leading-relaxed">{svc.description}</p>
                                            </div>
                                            <div className="flex-1 space-y-2.5 relative z-10">
                                                {svc.tiers.map((tier) => (
                                                    <div key={tier.label} className="flex justify-between items-baseline gap-2">
                                                        <span className="text-[11px] text-slate-500 truncate">{tier.label}</span>
                                                        <span className="text-[11px] font-black text-slate-900 shrink-0">{tier.price}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between relative z-10 mt-auto pt-4 border-t border-black/5">
                                                <Link href="/dashboard" className="text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-full group-hover:bg-blue-600 transition-colors shadow-md">
                                                    {svc.cta}
                                                </Link>
                                                <div className="h-8 w-8 rounded-full border-2 border-slate-900/5 flex items-center justify-center -rotate-45 group-hover:rotate-0 group-hover:border-blue-600 group-hover:text-blue-600 transition-all bg-white/50">
                                                    <ArrowRight className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* ── Management SOW Generator — admin only ── */}
                        {adminUserId && (
                            <section className="bg-white rounded-[48px] p-8 md:p-12 shadow-sm border border-slate-100 no-print">
                                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                                    <div>
                                        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-1 text-xs font-black uppercase tracking-widest text-white">
                                            <Download className="h-3 w-3" /> Management Report
                                        </div>
                                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Present to Leadership</h2>
                                        <p className="text-sm font-medium text-slate-500 mt-1">Generate a professional Scope of Work + ROI report ready to print or email to your C-suite.</p>
                                    </div>
                                    <button
                                        onClick={() => setShowSow(!showSow)}
                                        className="shrink-0 flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-blue-600 transition-all"
                                    >
                                        {showSow ? 'Hide Report' : 'Generate Report'}
                                        <ChevronDown className={`h-4 w-4 transition-transform ${showSow ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                {showSow && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Company / Store Name</label>
                                                <input
                                                    type="text" value={sowCompany} onChange={e => setSowCompany(e.target.value)}
                                                    placeholder="Acme Business"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Role</label>
                                                <input
                                                    type="text" value={sowRole} onChange={e => setSowRole(e.target.value)}
                                                    placeholder="Operations Manager"
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-400"
                                                />
                                            </div>
                                        </div>

                                        {/* SOW Document */}
                                        <div className="sow-print-area bg-[#FAFBFF] border border-slate-200 rounded-3xl p-8 md:p-12 space-y-10">
                                            <div className="flex justify-between items-start border-b border-slate-200 pb-8">
                                                <div>
                                                    <div className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2">AI Adoption — Scope of Work & ROI Report</div>
                                                    <h1 className="text-3xl font-black text-slate-900">{sowCompany || 'Your Company'}</h1>
                                                    <p className="text-sm text-slate-500 mt-2">Prepared by {sowRole || 'Your Name'} &nbsp;·&nbsp; {new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                </div>
                                                <div className="text-right shrink-0 ml-8">
                                                    <div className="text-[10px] uppercase tracking-widest text-slate-400">Prepared by</div>
                                                    <div className="font-black text-slate-900 mt-0.5">Audcomp AI Advisory</div>
                                                    <div className="text-xs text-slate-500">Hamilton, Ontario</div>
                                                </div>
                                            </div>

                                            <div>
                                                <h2 className="text-lg font-black text-slate-900 mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-blue-600" /> Executive Summary</h2>
                                                <p className="text-sm text-slate-600 leading-relaxed">{narrative || 'Based on your AI Adoption Advisor scan, targeted AI tools and one custom automation agent are recommended to drive measurable productivity gains and ROI within 12 months.'}</p>
                                            </div>

                                            <div>
                                                <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-emerald-600" /> Projected ROI</h2>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {[
                                                        { label: 'Annual Value', value: `$${Math.round(annualValue).toLocaleString()}` },
                                                        { label: 'Est. Investment', value: `$${Math.round(totalAnnualCost).toLocaleString()}` },
                                                        { label: 'Net ROI', value: `+${roiPct.toFixed(0)}%` },
                                                        { label: 'Payback Period', value: `${paybackMonths.toFixed(1)} mo` },
                                                    ].map(m => (
                                                        <div key={m.label} className="bg-white border border-slate-100 rounded-2xl p-4 text-center shadow-sm">
                                                            <div className="text-2xl font-black text-slate-900">{m.value}</div>
                                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{m.label}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {roadmap.length > 0 && (
                                                <div>
                                                    <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><Rocket className="h-4 w-4 text-indigo-600" /> Scope of Work</h2>
                                                    <div className="space-y-3">
                                                        {roadmap.map((phase, i) => (
                                                            <div key={i} className="flex gap-4 items-start bg-white border border-slate-100 rounded-2xl px-5 py-4">
                                                                <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center shrink-0">{phase.phase}</div>
                                                                <div>
                                                                    <div className="font-black text-slate-900 text-sm">{phase.title} <span className="text-slate-400 font-medium">— {phase.timeline}</span></div>
                                                                    <div className="text-xs text-slate-500 mt-0.5">{phase.items.slice(0, 2).join(' · ')}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {recommendations.length > 0 && (
                                                <div>
                                                    <h2 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><Target className="h-4 w-4 text-blue-600" /> Recommended Tools</h2>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                        {recommendations.slice(0, 4).map((rec, i) => (
                                                            <div key={i} className="flex justify-between items-center bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                                                                <div>
                                                                    <div className="font-black text-sm text-slate-900">{rec.tool}</div>
                                                                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{rec.priority} priority</div>
                                                                </div>
                                                                <div className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-xl shrink-0">{rec.monthlyEstimate}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="border-t border-slate-200 pt-6 flex flex-col md:flex-row justify-between gap-4">
                                                <div>
                                                    <h2 className="text-base font-black text-slate-900 mb-1">Recommended Next Step</h2>
                                                    <p className="text-sm text-slate-600">Book a free 30-minute discovery call to validate this roadmap and confirm scope before any budget commitment.</p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <div className="font-black text-blue-600 text-sm">aiaudit.audcomp.ai</div>
                                                    <div className="text-xs text-slate-400 mt-0.5">Hamilton, Ontario</div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                onClick={printSow}
                                                className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-blue-600 transition-all shadow-sm"
                                            >
                                                <Download className="h-4 w-4" /> Print / Save as PDF
                                            </button>
                                            <Link href="/dashboard" className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm">
                                                <Calendar className="h-4 w-4" /> Book Discovery Call
                                            </Link>
                                        </div>
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
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
