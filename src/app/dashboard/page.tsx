'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    ResponsiveContainer
} from 'recharts';
import {
    BarChart3,
    Search,
    Bell,
    CheckCircle2,
    Sparkles,
    Zap,
    Target,
    ArrowRight,
    MessageSquare,
    Loader2,
    ShieldCheck,
    TrendingUp,
    Layout,
    FileText
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [auditData, setAuditData] = useState<any>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchResults() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/auth');
                    return;
                }

                // Check if audit is actually finished
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('has_completed_audit')
                    .eq('id', session.user.id)
                    .single() as any;

                if (!profile?.has_completed_audit) {
                    router.push('/survey');
                    return;
                }

                const { data, error } = await supabase
                    .from('audit_scores')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single() as any;

                if (!error && data) {
                    setAuditData(data);
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchResults();
    }, []);

    const displayData = auditData || {
        overall_score: 38,
        category_scores: [
            { category: 'Strategy', score: 45 },
            { category: 'Data', score: 30 },
            { category: 'Technical', score: 55 },
            { category: 'Governance', score: 20 },
            { category: 'Operational', score: 40 },
        ],
    };

    const tieredRecommendations = displayData.overall_score >= 65 ? [
        {
            title: "Advanced Co-pilot Agents",
            desc: "Custom AI workforce tailored for complex departmental operations.",
            tag: "Advanced",
            color: "bg-blue-50 text-blue-600 border-blue-100/50",
            icon: Zap,
        },
        {
            title: "Advanced Multi-agent Consulting",
            desc: "Architecting autonomous systems that handle complex multi-step tasks.",
            tag: "Integration",
            color: "bg-indigo-50 text-indigo-600 border-indigo-100/50",
            icon: Sparkles,
        },
        {
            title: "Org-wide AI Implementation",
            desc: "Full-scale deployment strategies for enterprise-wide AI adoption.",
            tag: "Scale",
            color: "bg-amber-50 text-amber-600 border-amber-100/50",
            icon: Target,
        }
    ] : [
        {
            title: "AI Readiness Assessment",
            desc: "Full deep-dive into your infrastructure and data quality.",
            tag: "Foundation",
            color: "bg-blue-50 text-blue-600 border-blue-100/50",
            icon: Target,
        },
        {
            title: "Expert AI Consulting",
            desc: "Strategic roadmap to align AI with your business goals.",
            tag: "Strategy",
            color: "bg-indigo-50 text-indigo-600 border-indigo-100/50",
            icon: Sparkles,
        },
        {
            title: "Co-pilot Agent Development",
            desc: "Build custom AI agents to automate your team's workflows.",
            tag: "Automation",
            color: "bg-amber-50 text-amber-600 border-amber-100/50",
            icon: Zap,
        }
    ];

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE]">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800 selection:bg-blue-600/10">
            {/* Background Accent */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[120px]" />
            </div>

            {/* Header */}
            <header className="flex w-full items-center justify-between px-10 py-6 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
                <div className="flex items-center gap-12">
                    <Link href="/" className="flex items-center">
                        <img
                            src="/images/AUDCOMP-LOGO.png"
                            alt="AUDCOMP"
                            className="h-9 w-auto brightness-0"
                        />
                    </Link>

                    <nav className="hidden lg:flex items-center gap-1">
                        <button className="px-6 py-2.5 rounded-full bg-slate-900 text-white text-sm font-black shadow-lg shadow-slate-900/10">Dashboard</button>
                        <button className="px-5 py-2.5 rounded-full text-slate-400 hover:text-slate-900 text-sm font-bold transition-all">My Audit</button>
                        <button className="px-5 py-2.5 rounded-full text-slate-400 hover:text-slate-900 text-sm font-bold transition-all">Strategy</button>
                        <button className="px-5 py-2.5 rounded-full text-slate-400 hover:text-slate-900 text-sm font-bold transition-all">Support</button>
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-5 text-slate-300">
                        <Search className="h-5 w-5 cursor-pointer hover:text-slate-600 transition-colors" />
                        <Bell className="h-5 w-5 cursor-pointer hover:text-slate-600 transition-colors" />
                    </div>
                    <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-slate-900">Workspace</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Premium Plan</p>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-600/20">
                            <div className="h-full w-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=Client&background=fff&color=3b82f6`} alt="Avatar" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-10 pt-12 pb-24 relative z-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
                    <div>
                        <h2 className="text-sm font-black text-blue-600 uppercase tracking-[0.2em] mb-3">Assessment Analytics</h2>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Your AI Readiness</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 w-10 rounded-full border-4 border-[#F4F7FE] bg-slate-200 overflow-hidden shadow-sm">
                                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Expert" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm font-bold text-slate-400 italic">3 Experts assigned to your roadmap</p>
                    </div>
                </div>

                {/* Bento Grid */}
                <div className="grid grid-cols-12 gap-8">

                    {/* Left Panel - High Impact Recommendations */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        <section className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100/50">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Recommended Services</h2>
                                </div>
                                <button className="text-slate-400 text-sm font-black hover:text-blue-600 uppercase tracking-widest transition-colors">See All Recommendations</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {tieredRecommendations.map((rec: any, i: number) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                        className={`${rec.color} rounded-[40px] p-8 flex flex-col justify-between min-h-[260px] border relative overflow-hidden group hover:scale-[1.03] transition-all duration-500 cursor-pointer shadow-sm hover:shadow-xl hover:shadow-blue-900/5`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-5">
                                                <div className="bg-white/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">High Priority</div>
                                                <rec.icon className="h-6 w-6 opacity-40 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                            <h3 className="text-xl font-black leading-[1.2] mb-3 text-slate-900">{rec.title}</h3>
                                            <p className="text-xs font-bold leading-relaxed opacity-60 group-hover:opacity-80 transition-opacity">{rec.desc}</p>
                                        </div>
                                        <div className="mt-8 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-full">Book Now</span>
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-sm -rotate-45 group-hover:rotate-0 transition-transform">
                                                <ArrowRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <article className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100/50">
                                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                                    <Layout className="h-5 w-5 text-indigo-500" />
                                    Metric Breakdown
                                </h3>
                                <div className="space-y-6">
                                    {displayData.category_scores.map((cat: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                                                    <BarChart3 className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 leading-none mb-1">{cat.category}</p>
                                                    <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-blue-600 rounded-full" style={{ width: `${cat.score}%` }} />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-sm font-black text-slate-900">{cat.score}%</span>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <article className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100/50">
                                <h3 className="text-xl font-black mb-8 flex items-center gap-3">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    Industry Comparison
                                </h3>
                                <div className="h-[210px] w-full mt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={displayData.category_scores}>
                                            <PolarGrid stroke="#f1f5f9" strokeWidth={2} />
                                            <PolarAngleAxis dataKey="category" tick={{ fill: '#cbd5e1', fontSize: 10, fontWeight: 900 }} />
                                            <Radar
                                                name="You"
                                                dataKey="score"
                                                stroke="#3b82f6"
                                                strokeWidth={3}
                                                fill="#3b82f6"
                                                fillOpacity={0.2}
                                            />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>
                            </article>
                        </div>
                    </div>

                    {/* Right Panel - Core Score */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        <section className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100/50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5">
                                <Sparkles className="h-32 w-32" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Overall Score</h2>
                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                </div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">Verified Readiness Rank</p>

                                <div className="relative flex items-center justify-center mb-10">
                                    <div className="relative h-56 w-56 scale-110">
                                        <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
                                            {/* Outer Ring */}
                                            <circle cx="50" cy="50" r="44" fill="transparent" stroke="#F8FAFC" strokeWidth="10" />
                                            <motion.circle
                                                cx="50" cy="50" r="44"
                                                fill="transparent"
                                                stroke="url(#grad-blue)"
                                                strokeWidth="10"
                                                strokeDasharray="276.46"
                                                initial={{ strokeDashoffset: 276.46 }}
                                                animate={{ strokeDashoffset: 276.46 * (1 - displayData.overall_score / 100) }}
                                                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                                                strokeLinecap="round"
                                            />

                                            {/* Middle Ring */}
                                            <circle cx="50" cy="50" r="32" fill="transparent" stroke="#F8FAFC" strokeWidth="8" />
                                            <motion.circle
                                                cx="50" cy="50" r="32"
                                                fill="transparent"
                                                stroke="#818cf8"
                                                strokeWidth="8"
                                                strokeDasharray="201.06"
                                                initial={{ strokeDashoffset: 201.06 }}
                                                animate={{ strokeDashoffset: 201.06 * (0.6) }}
                                                transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
                                                strokeLinecap="round"
                                            />

                                            <defs>
                                                <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="0%">
                                                    <stop offset="0%" stopColor="#2563eb" />
                                                    <stop offset="100%" stopColor="#3b82f6" />
                                                </linearGradient>
                                            </defs>
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{displayData.overall_score}%</span>
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Ready</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-10 border-t border-slate-50">
                                    <div className="flex items-center justify-between p-4 rounded-3xl bg-blue-50/50 border border-blue-100/20">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
                                            <span className="text-sm font-bold text-slate-600">AI Readiness</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">{displayData.overall_score}%</span>
                                    </div>
                                    <div className="flex items-center justify-between p-4 rounded-3xl bg-slate-50 border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="h-2 w-2 rounded-full bg-indigo-400" />
                                            <span className="text-sm font-bold text-slate-600">Market Benchmark</span>
                                        </div>
                                        <span className="text-sm font-black text-slate-900">42%</span>
                                    </div>
                                </div>

                                <button className="w-full mt-10 bg-slate-900 hover:bg-black text-white font-black py-5 rounded-[24px] shadow-2xl shadow-slate-900/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-3 active:scale-95">
                                    <FileText className="h-5 w-5" />
                                    Download Full Roadmap
                                </button>
                            </div>
                        </section>

                        <section className="bg-gradient-to-br from-slate-900 to-blue-900 rounded-[48px] p-10 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_20%_20%,_white_0%,_transparent_50%)]" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                                        <MessageSquare className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="bg-blue-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-400/20">24/7 Agent</div>
                                </div>
                                <h2 className="text-2xl font-black mb-4 tracking-tight leading-tight">Expert Strategy Call</h2>
                                <p className="text-sm font-bold opacity-60 mb-8 leading-relaxed">
                                    Your assessment is ready. Let's build your custom AI automation roadmap together.
                                </p>
                                <button className="w-full bg-white text-slate-900 font-black py-4 rounded-[20px] transition-all hover:bg-blue-50 flex items-center justify-center gap-3 shadow-xl">
                                    Book 15-Min Discovery
                                </button>
                            </div>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}
