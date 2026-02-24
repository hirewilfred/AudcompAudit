'use client';

import { motion } from 'framer-motion';
import {
    Binary,
    Calculator,
    Rocket,
    ArrowRight,
    CheckCircle2,
    Zap,
    Search
} from 'lucide-react';
import Link from 'next/link';

const steps = [
    {
        number: "01",
        title: "The AI Discovery Audit",
        desc: "We begin with a deep dive into your current workflows. This 15-minute diagnostic identifies high-friction manual processes that are prime candidates for AI automation.",
        icon: Search,
        color: "blue",
        features: ["Workflow Analysis", "Data Security Review", "Tool Compatibility Check"]
    },
    {
        number: "02",
        title: "Precision ROI Mapping",
        desc: "Using our proprietary ROI AI Calculator, we translate theoretical efficiency into hard numbers: hours saved, labor costs reduced, and projected annual yield.",
        icon: Calculator,
        color: "indigo",
        features: ["Labor Cost Modeling", "Efficiency Projections", "Payback Period Analysis"]
    },
    {
        number: "03",
        title: "Strategic Implementation Roadmap",
        desc: "We deliver a customized, four-phase timeline. From assessment to full-scale autonomous agent deployment, your path to AI maturity is clearly defined.",
        icon: Zap,
        color: "sky",
        features: ["Phase-by-Phase Timeline", "Risk Mitigation Strategy", "Technology Stack Selection"]
    },
    {
        number: "04",
        title: "Guided Execution & Support",
        desc: "You're never alone. Our assigned AI experts guide your team through the transition, ensuring seamless integration and measurable success at every milestone.",
        icon: Rocket,
        color: "emerald",
        features: ["Expert Assigned Support", "Continuous Optimization", "Team Upskilling"]
    }
];

export default function HowItWorks() {
    return (
        <div className="relative min-h-screen bg-[#050B1A] text-white overflow-hidden">
            {/* Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-blue-600/5 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[120px]" />

            <header className="fixed top-0 z-50 flex w-full items-center justify-between px-8 py-6 backdrop-blur-md border-b border-white/5">
                <Link href="/" className="flex items-center">
                    <img
                        src="/images/AUDCOMP-LOGO.png"
                        alt="AUDCOMP"
                        className="h-10 w-auto"
                    />
                </Link>
                <Link
                    href="/"
                    className="text-sm font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
                >
                    Back to Home
                </Link>
            </header>

            <main className="relative z-10 pt-40 pb-32">
                <div className="mx-auto max-w-7xl px-6">
                    {/* Hero Section */}
                    <div className="text-center mb-32">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-8"
                        >
                            <Binary className="h-4 w-4" />
                            Our Methodology
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-7xl font-black tracking-tight mb-8"
                        >
                            The Path to <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">AI Excellence</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="mx-auto max-w-2xl text-lg text-slate-400 leading-relaxed font-bold"
                        >
                            Transforming your business with AI isn't about chasing trends. It's about a structured, data-driven approach to efficiency and growth. Here is how we make it happen.
                        </motion.p>
                    </div>

                    {/* Steps Section */}
                    <div className="space-y-32">
                        {steps.map((step, i) => (
                            <motion.section
                                key={i}
                                initial={{ opacity: 0, y: 40 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8 }}
                                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-16 md:gap-24`}
                            >
                                {/* Visual Side */}
                                <div className="flex-1 w-full">
                                    <div className="relative group">
                                        <div className={`absolute -inset-4 rounded-[48px] bg-gradient-to-br from-${step.color}-600/20 to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                                        <div className="relative aspect-square md:aspect-video rounded-[48px] bg-slate-900/50 border border-white/5 overflow-hidden flex items-center justify-center group-hover:border-blue-500/30 transition-all duration-700">
                                            <div className="absolute top-0 right-0 p-8">
                                                <span className={`text-8xl font-black text-${step.color}-500/10`}>{step.number}</span>
                                            </div>
                                            <step.icon className={`h-24 w-24 text-${step.color}-500/80 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]`} />
                                        </div>
                                    </div>
                                </div>

                                {/* Content Side */}
                                <div className="flex-1">
                                    <h3 className={`text-sm font-black uppercase tracking-[0.3em] text-${step.color}-500 mb-6`}>
                                        Step {step.number}
                                    </h3>
                                    <h2 className="text-4xl font-black text-white mb-8 tracking-tight leading-tight">
                                        {step.title}
                                    </h2>
                                    <p className="text-lg text-slate-400 font-bold leading-relaxed mb-10">
                                        {step.desc}
                                    </p>
                                    <div className="space-y-4">
                                        {step.features.map((feature, idx) => (
                                            <div key={idx} className="flex items-center gap-3">
                                                <div className={`h-5 w-5 rounded-full bg-${step.color}-500/10 border border-${step.color}-500/20 flex items-center justify-center`}>
                                                    <CheckCircle2 className={`h-3 w-3 text-${step.color}-400`} />
                                                </div>
                                                <span className="text-sm font-black text-slate-300 tracking-wide">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.section>
                        ))}
                    </div>

                    {/* Final CTA */}
                    <motion.section
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="mt-48 text-center p-16 rounded-[64px] bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border border-white/5 relative overflow-hidden group"
                    >
                        <div className="absolute top-0 right-0 p-20 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Zap className="h-64 w-64" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tight">Ready to see your <br className="md:hidden" /> AI Roadmap?</h2>
                        <Link
                            href="/auth"
                            className="inline-flex items-center gap-3 rounded-2xl bg-white px-10 py-5 text-lg font-black text-slate-900 transition-all hover:bg-blue-50 hover:scale-105 shadow-xl shadow-blue-500/10"
                        >
                            Start Free AI Audit
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </motion.section>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">
                © 2026 AUDCOMP Information Technology Solutions. All Rights Reserved.
            </footer>
        </div>
    );
}
