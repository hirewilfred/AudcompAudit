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
    FileText,
    X,
    Database,
    Cpu,
    Shield,
    Activity,
    Globe,
    User,
    Settings,
    Phone,
    Building,
    Mail as MailIcon,
    Calendar,
    Compass,
    Rocket
} from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [auditData, setAuditData] = useState<any>(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // ROI Calculator State
    const [roiEmployees, setRoiEmployees] = useState(5);
    const [roiFrequency, setRoiFrequency] = useState(10); // per week
    const [roiMinutes, setRoiMinutes] = useState(30);
    const [roiHourlyRate, setRoiHourlyRate] = useState(50);

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

                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single() as any;

                if (!profile?.has_completed_audit) {
                    router.push('/survey');
                    return;
                }
                setProfile(profile);

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
            color: "bg-gradient-to-br from-sky-50 to-white text-sky-800 border-sky-100/50",
            iconColor: "text-sky-500",
            icon: Zap,
            pattern: "radial-gradient(circle at 2px 2px, #bae6fd 1px, transparent 0)",
        },
        {
            title: "Advanced Multi-agent Consulting",
            desc: "Architecting autonomous systems that handle complex multi-step tasks.",
            tag: "Integration",
            color: "bg-gradient-to-br from-blue-50 to-white text-blue-800 border-blue-100/50",
            iconColor: "text-blue-500",
            icon: Sparkles,
            pattern: "radial-gradient(circle at 2px 2px, #bfdbfe 1px, transparent 0)",
        },
        {
            title: "Org-wide AI Implementation",
            desc: "Full-scale deployment strategies for enterprise-wide AI adoption.",
            tag: "Scale",
            color: "bg-gradient-to-br from-indigo-50 to-white text-indigo-800 border-indigo-100/50",
            iconColor: "text-indigo-500",
            icon: Target,
            pattern: "radial-gradient(circle at 2px 2px, #c7d2fe 1px, transparent 0)",
        }
    ] : [
        {
            title: "AI Readiness Assessment",
            desc: "Full deep-dive into your infrastructure and data quality.",
            tag: "Foundation",
            color: "bg-gradient-to-br from-sky-50 to-white text-sky-800 border-sky-100/50",
            iconColor: "text-sky-500",
            icon: Target,
            pattern: "radial-gradient(circle at 2px 2px, #bae6fd 1px, transparent 0)",
        },
        {
            title: "Expert AI Consulting",
            desc: "Strategic roadmap to align AI with your business goals.",
            tag: "Strategy",
            color: "bg-gradient-to-br from-blue-50 to-white text-blue-800 border-blue-100/50",
            iconColor: "text-blue-500",
            icon: Sparkles,
            pattern: "radial-gradient(circle at 2px 2px, #bfdbfe 1px, transparent 0)",
        },
        {
            title: "Co-pilot Agent Development",
            desc: "Build custom AI agents to automate your team's workflows.",
            tag: "Automation",
            color: "bg-gradient-to-br from-indigo-50 to-white text-indigo-800 border-indigo-100/50",
            iconColor: "text-indigo-500",
            icon: Zap,
            pattern: "radial-gradient(circle at 2px 2px, #c7d2fe 1px, transparent 0)",
        }
    ];

    const handleBooking = () => {
        setIsBookingOpen(true);
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { error } = await (supabase.from('profiles') as any).update({
                full_name: profile.full_name,
                organization: profile.organization,
                phone: profile.phone,
                updated_at: new Date().toISOString()
            }).eq('id', user.id);

            if (error) throw error;
            setIsSettingsOpen(false);
        } catch (err) {
            console.error("Error updating profile:", err);
        } finally {
            setIsSaving(false);
        }
    };

    // ROI Calculations
    const hoursPerMonth = (roiEmployees * roiFrequency * 4.33 * roiMinutes) / 60;
    const costPerMonth = hoursPerMonth * roiHourlyRate;
    const costPerYear = costPerMonth * 12;

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
                    </nav>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-5 text-slate-300">
                        <Bell className="h-5 w-5 cursor-pointer hover:text-slate-600 transition-colors" />
                        <Settings
                            className="h-5 w-5 cursor-pointer hover:text-slate-600 transition-colors"
                            onClick={() => setIsSettingsOpen(true)}
                        />
                    </div>
                    <div className="flex items-center gap-4 pl-6 border-l border-slate-100 cursor-pointer group" onClick={() => setIsSettingsOpen(true)}>
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{profile?.organization || 'Workspace'}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Premium Plan</p>
                        </div>
                        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                            <div className="h-full w-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden">
                                <img src={`https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=fff&color=3b82f6`} alt="Avatar" />
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
                                        onClick={handleBooking}
                                        className={`${rec.color} rounded-[40px] p-8 flex flex-col justify-between min-h-[260px] border-2 relative overflow-hidden group hover:scale-[1.03] transition-all duration-500 cursor-pointer shadow-sm hover:shadow-2xl hover:shadow-blue-900/10`}
                                    >
                                        <div
                                            className="absolute inset-0 opacity-[0.4]"
                                            style={{
                                                backgroundImage: rec.pattern,
                                                backgroundSize: '24px 24px'
                                            }}
                                        />
                                        <div className="absolute top-0 right-0 -mr-4 -mt-4 h-32 w-32 bg-current opacity-[0.03] rounded-full blur-3xl group-hover:opacity-[0.08] transition-opacity" />

                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-500 animate-float">
                                                    <rec.icon className={`h-6 w-6 ${rec.iconColor}`} />
                                                </div>
                                                <div className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em] leading-none border border-black/5 opacity-60">{rec.tag}</div>
                                            </div>
                                            <h3 className="text-xl font-black leading-[1.2] mb-3">{rec.title}</h3>
                                            <p className="text-xs font-bold leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">{rec.desc}</p>
                                        </div>
                                        <div className="mt-8 flex items-center justify-between relative z-10">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black uppercase tracking-widest bg-slate-900 text-white px-4 py-2 rounded-full group-hover:bg-blue-600 transition-colors shadow-lg shadow-slate-900/10 group-hover:shadow-blue-600/20">Book Now</span>
                                            </div>
                                            <div className="h-10 w-10 rounded-full border-2 border-slate-900/5 flex items-center justify-center text-slate-900 -rotate-45 group-hover:rotate-0 group-hover:border-blue-600 group-hover:text-blue-600 transition-all bg-white/50 backdrop-blur-sm">
                                                <ArrowRight className="h-5 w-5" />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </section>

                        {/* Implementation Roadmap Timeline */}
                        <section className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100/50">
                            <div className="flex items-center justify-between mb-10">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                        <Compass className="h-5 w-5" />
                                    </div>
                                    <h2 className="text-2xl font-black tracking-tight text-slate-900">Your AI Implementation Roadmap</h2>
                                </div>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100">
                                    <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Active Phase</span>
                                </div>
                            </div>

                            <div className="relative">
                                {/* Vertical Line */}
                                <div className="absolute left-8 top-0 bottom-0 w-[2px] bg-slate-100" />

                                <div className="space-y-12 relative px-2">
                                    {[
                                        {
                                            phase: "Phase 01: Assessment",
                                            title: "Strategic Infrastructure Audit",
                                            status: "Completed",
                                            desc: "Comprehensive review of current technical stack and data sovereignty requirements.",
                                            icon: ShieldCheck,
                                            active: false,
                                            done: true
                                        },
                                        {
                                            phase: "Phase 02: Alignment",
                                            title: "Executive Strategy Session",
                                            status: "In Progress",
                                            desc: "Mapping AI opportunities to high-ROI business outcomes and departmental workflows.",
                                            icon: Calendar,
                                            active: true,
                                            done: false
                                        },
                                        {
                                            phase: "Phase 03: Foundation",
                                            title: "Enterprise Agent Framework",
                                            status: "Scheduled",
                                            desc: "Deployment of custom LLM gateways and secure data connectors.",
                                            icon: Database,
                                            active: false,
                                            done: false
                                        },
                                        {
                                            phase: "Phase 04: Automation",
                                            title: "Departmental Co-pilot Launch",
                                            status: "Waitlisted",
                                            desc: "Full rollout of autonomous agents across high-impact business units.",
                                            icon: Rocket,
                                            active: false,
                                            done: false
                                        }
                                    ].map((item, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className="flex gap-8 group"
                                        >
                                            <div className="relative z-10">
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${item.done
                                                    ? 'bg-blue-600 text-white shadow-blue-600/20'
                                                    : item.active
                                                        ? 'bg-indigo-600 text-white shadow-indigo-600/40 scale-110 ring-4 ring-indigo-50'
                                                        : 'bg-slate-50 text-slate-300 border border-slate-100 group-hover:bg-slate-100 group-hover:text-slate-500'
                                                    }`}>
                                                    <item.icon className={`h-6 w-6 ${item.active ? 'animate-pulse' : ''}`} />
                                                </div>
                                                {item.done && (
                                                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                                                        <CheckCircle2 className="h-3 w-3 text-white" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 pt-1">
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                                                    <h3 className={`text-sm font-black uppercase tracking-widest ${item.active ? 'text-indigo-600' : 'text-slate-400'}`}>
                                                        {item.phase}
                                                    </h3>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${item.done
                                                        ? 'bg-blue-50 text-blue-600 border-blue-100'
                                                        : item.active
                                                            ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                            : 'bg-slate-50 text-slate-400 border-slate-100'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </div>
                                                <h4 className={`text-xl font-black mb-2 transition-colors ${item.active ? 'text-slate-900 leading-none' : 'text-slate-500'}`}>
                                                    {item.title}
                                                </h4>
                                                <p className="text-sm font-bold text-slate-400 max-w-lg leading-relaxed">
                                                    {item.desc}
                                                </p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <article className="bg-white rounded-[48px] p-10 shadow-sm border border-slate-100/50">
                                <h3 className="text-xl font-black mb-10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Layout className="h-5 w-5" />
                                        </div>
                                        Metric Breakdown
                                    </div>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Live Data</span>
                                </h3>
                                <div className="space-y-5">
                                    {displayData.category_scores.map((cat: any, i: number) => {
                                        const configMap: Record<string, any> = {
                                            'Strategy': { icon: Globe, color: 'from-sky-400 to-sky-600', bg: 'bg-sky-50', text: 'text-sky-600' },
                                            'Data': { icon: Database, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50', text: 'text-blue-600' },
                                            'Technical': { icon: Cpu, color: 'from-indigo-500 to-indigo-700', bg: 'bg-indigo-50', text: 'text-indigo-600' },
                                            'Governance': { icon: Shield, color: 'from-slate-700 to-slate-900', bg: 'bg-slate-50', text: 'text-slate-900' },
                                            'Operational': { icon: Activity, color: 'from-emerald-500 to-emerald-700', bg: 'bg-emerald-50', text: 'text-emerald-600' },
                                        };
                                        const config = configMap[cat.category] || { icon: BarChart3, color: 'from-blue-600 to-indigo-600', bg: 'bg-slate-50', text: 'text-blue-600' };

                                        return (
                                            <motion.div
                                                key={i}
                                                whileHover={{ x: 5 }}
                                                className="group flex flex-col gap-3 p-4 rounded-[28px] hover:bg-slate-50/50 transition-all duration-300 border border-transparent hover:border-slate-100"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`h-10 w-10 rounded-2xl ${config.bg} flex items-center justify-center ${config.text} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                                                            <config.icon className="h-5 w-5" />
                                                        </div>
                                                        <span className="text-sm font-black text-slate-900">{cat.category}</span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-sm font-black text-slate-900">{cat.score}</span>
                                                        <span className="text-[10px] font-bold text-slate-400">%</span>
                                                    </div>
                                                </div>
                                                <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${cat.score}%` }}
                                                        transition={{ duration: 1.5, delay: i * 0.1 + 0.5, ease: [0.16, 1, 0.3, 1] }}
                                                        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${config.color} shadow-[0_0_10px_rgba(59,130,246,0.3)]`}
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
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
                                    <div className="relative h-64 w-64">
                                        {/* Outer Spinning Glow Ring */}
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 rounded-full border border-dashed border-blue-200/50 opacity-50"
                                        />

                                        <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                                            <defs>
                                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                </filter>
                                                <linearGradient id="neon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                                    <stop offset="0%" stopColor="#3b82f6" />
                                                    <stop offset="50%" stopColor="#60a5fa" />
                                                    <stop offset="100%" stopColor="#818cf8" />
                                                </linearGradient>
                                                <radialGradient id="center-glass">
                                                    <stop offset="0%" stopColor="rgba(255, 255, 255, 1)" />
                                                    <stop offset="100%" stopColor="rgba(244, 247, 254, 0.5)" />
                                                </radialGradient>
                                            </defs>

                                            {/* Track Background */}
                                            <circle cx="50" cy="50" r="46" fill="transparent" stroke="#F1F5F9" strokeWidth="8" />

                                            {/* Main Score Ring (Animated) */}
                                            <motion.circle
                                                cx="50" cy="50" r="46"
                                                fill="transparent"
                                                stroke="url(#neon-grad)"
                                                strokeWidth="8"
                                                strokeDasharray="289"
                                                initial={{ strokeDashoffset: 289 }}
                                                animate={{ strokeDashoffset: 289 * (1 - displayData.overall_score / 100) }}
                                                transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
                                                strokeLinecap="round"
                                                filter="url(#glow)"
                                            />

                                            {/* Secondary Data Ring */}
                                            <circle cx="50" cy="50" r="38" fill="url(#center-glass)" stroke="#F8FAFC" strokeWidth="1" />
                                            <motion.circle
                                                cx="50" cy="50" r="38"
                                                fill="transparent"
                                                stroke="#E2E8F0"
                                                strokeWidth="3"
                                                strokeDasharray="238"
                                                initial={{ strokeDashoffset: 238 }}
                                                animate={{ strokeDashoffset: 238 * 0.3 }}
                                                transition={{ duration: 2, delay: 0.5 }}
                                                strokeLinecap="round"
                                                opacity="0.5"
                                            />

                                            {/* Radar Sweep Effect */}
                                            <motion.circle
                                                cx="50" cy="50" r="46"
                                                fill="transparent"
                                                stroke="#3b82f6"
                                                strokeWidth="2"
                                                strokeDasharray="1 288"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                                strokeLinecap="round"
                                            />
                                        </svg>

                                        {/* Center Text Container */}
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <div className="relative">
                                                <motion.span
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className="text-6xl font-black text-slate-900 tracking-tighter tabular-nums"
                                                >
                                                    {displayData.overall_score}
                                                </motion.span>
                                                <span className="text-2xl font-black text-blue-600/40 absolute -top-1 -right-6">%</span>
                                            </div>
                                            <div className="bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest mt-2 shadow-lg shadow-blue-600/20 animate-pulse">
                                                AI Verified
                                            </div>
                                        </div>

                                        {/* Outer Decorative Dots */}
                                        {[...Array(8)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-1.5 h-1.5 rounded-full bg-slate-200"
                                                style={{
                                                    top: '50%',
                                                    left: '50%',
                                                    transform: `rotate(${i * 45}deg) translateY(-54px)`
                                                }}
                                            />
                                        ))}
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

                        <section className="bg-slate-900 rounded-[48px] p-10 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-full h-full opacity-5 bg-[radial-gradient(circle_at_80%_20%,_#3b82f6_0%,_transparent_50%)]" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-600/20 flex items-center justify-center backdrop-blur-md border border-blue-500/20">
                                        <TrendingUp className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="bg-blue-500/20 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-400/20">ROI AI Calculator</div>
                                </div>
                                <h2 className="text-2xl font-black mb-6 tracking-tight leading-tight">Labor & Process Savings</h2>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Employees Involved</span>
                                            <span className="text-blue-400">{roiEmployees}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="50"
                                            value={roiEmployees}
                                            onChange={(e) => setRoiEmployees(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Frequency (Tasks/Week)</span>
                                            <span className="text-blue-400">{roiFrequency}</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="100"
                                            value={roiFrequency}
                                            onChange={(e) => setRoiFrequency(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Mins per Task</span>
                                            <span className="text-blue-400">{roiMinutes}m</span>
                                        </div>
                                        <input
                                            type="range" min="5" max="120" step="5"
                                            value={roiMinutes}
                                            onChange={(e) => setRoiMinutes(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-[11px] font-black uppercase tracking-widest text-slate-500">
                                            <span>Hourly Labor Cost</span>
                                            <span className="text-blue-400">${roiHourlyRate}/hr</span>
                                        </div>
                                        <input
                                            type="range" min="20" max="250" step="5"
                                            value={roiHourlyRate}
                                            onChange={(e) => setRoiHourlyRate(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                                        />
                                    </div>

                                    <div className="mt-10 p-6 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Monthly Hours</p>
                                                <p className="text-xl font-black text-white">{Math.round(hoursPerMonth)}h</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Monthly Cost</p>
                                                <p className="text-xl font-black text-blue-400">${Math.round(costPerMonth).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Projected Annual Savings</p>
                                            <p className="text-3xl font-black text-white decoration-blue-500/50 underline-offset-8 underline decoration-4">
                                                ${Math.round(costPerYear).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleBooking}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-[20px] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 mt-4"
                                    >
                                        Capture These Savings
                                        <ArrowRight className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {/* Booking Modal */}
            <AnimatePresence>
                {isBookingOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md"
                        onClick={() => setIsBookingOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative w-full max-w-4xl h-[85vh] bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Schedule Your AI Strategy Session</h3>
                                    <p className="text-sm font-bold text-slate-400">Select a time that works best for your team.</p>
                                </div>
                                <button
                                    onClick={() => setIsBookingOpen(false)}
                                    className="h-10 w-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Booking Embed Container */}
                            <div className="flex-1 w-full bg-slate-50/50">
                                {/* Replace the URL below with your actual Cal.com or Calendly embed URL */}
                                <iframe
                                    src="https://cal.com/hirewilfred/15min?embed=true"
                                    className="w-full h-full border-0"
                                    title="Schedule Session"
                                />
                            </div>

                            {/* Modal Footer */}
                            <div className="px-8 py-4 bg-white border-t border-slate-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-300">
                                <span>Powered by Cal.com & Audcomp</span>
                                <span>Secure Strategy Booking</span>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Profile Settings Modal */}
            <AnimatePresence>
                {isSettingsOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
                        onClick={() => setIsSettingsOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-white rounded-[40px] shadow-2xl p-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Organization Profile</h3>
                                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <input
                                            type="text"
                                            value={profile?.full_name || ''}
                                            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                                            placeholder="Your Name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Company Name</label>
                                    <div className="relative">
                                        <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <input
                                            type="text"
                                            value={profile?.organization || ''}
                                            onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                                            placeholder="Company Name"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <input
                                            type="tel"
                                            value={profile?.phone || ''}
                                            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                                            placeholder="+1 (555) 000-0000"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] shadow-xl hover:bg-black transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Changes'}
                                    {!isSaving && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
