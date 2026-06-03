'use client';

import { motion } from 'framer-motion';
import {
    Calculator,
    Rocket,
    ArrowRight,
    CheckCircle2,
    Zap,
    Search,
    TrendingUp
} from 'lucide-react';
import Link from 'next/link';

const APPLE_EASE = [0.22, 1, 0.36, 1] as const;
const APPLE_EASE_STRONG = [0.16, 1, 0.3, 1] as const;

const successStories = [
    {
        company: "Summit Manufacturing",
        industry: "Custom Fabrication",
        challenge: "Spending 20+ hours weekly on manual inventory reconciliation and order tracking.",
        solution: "Deployed a custom Inventory Agent that syncs shop floor data with procurement in real time.",
        result: "18 hrs / week saved",
        metric: "90% reduction in manual data entry"
    },
    {
        company: "Lakeside Legal",
        industry: "Professional Services",
        challenge: "Inbound inquiry overload was causing 48-hour response delays for potential clients.",
        solution: "Implemented an AI triage system to classify, prioritize, and draft initial responses.",
        result: "40% higher lead conversion",
        metric: "< 5 minute response time for high-value leads"
    },
    {
        company: "Echo Logistics",
        industry: "Transportation & Supply",
        challenge: "Reactive maintenance and unpredictable dispatch gaps affecting profit margins.",
        solution: "Integrated a predictive dispatch engine using historical route data and AI forecasting.",
        result: "$54k annual labor savings",
        metric: "15% efficiency gain across 12-truck fleet"
    }
];

const steps = [
    {
        number: "01",
        title: "The AI discovery audit",
        desc: "We begin with a deep dive into your current workflows. A 15-minute diagnostic identifies high-friction manual processes that are prime candidates for AI automation.",
        icon: Search,
        features: ["Workflow analysis", "Data security review", "Tool compatibility check"]
    },
    {
        number: "02",
        title: "Precision ROI mapping",
        desc: "Using our proprietary ROI engine, we translate theoretical efficiency into hard numbers — hours saved, labor costs reduced, and projected annual yield.",
        icon: Calculator,
        features: ["Labor cost modeling", "Efficiency projections", "Payback period analysis"]
    },
    {
        number: "03",
        title: "Strategic implementation roadmap",
        desc: "We deliver a customized, four-phase timeline. From assessment to full-scale autonomous agent deployment, your path to AI maturity is clearly defined.",
        icon: Zap,
        features: ["Phase-by-phase timeline", "Risk mitigation strategy", "Technology stack selection"]
    },
    {
        number: "04",
        title: "Guided execution & support",
        desc: "You're never alone. Assigned AI experts guide your team through the transition, ensuring seamless integration and measurable success at every milestone.",
        icon: Rocket,
        features: ["Expert-assigned support", "Continuous optimization", "Team upskilling"]
    }
];

export default function HowItWorks() {
    return (
        <div className="relative min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">

            {/* Apple-style thin glass nav */}
            <header className="sticky top-0 z-50 border-b hairline bg-white/72 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/60">
                <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-6">
                    <Link href="/" className="flex items-center">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-5 w-auto opacity-90" />
                    </Link>
                    <Link href="/" className="text-[12px] font-normal text-[#1d1d1f]/85 hover:text-[#1d1d1f] transition-colors">
                        Back to home
                    </Link>
                </div>
            </header>

            <main className="relative pt-24 sm:pt-32 pb-32">
                <div className="mx-auto max-w-[1024px] px-6">

                    {/* Hero */}
                    <div className="text-center mb-32 sm:mb-40">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: APPLE_EASE }}
                            className="eyebrow mb-5"
                        >
                            Our methodology
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: APPLE_EASE_STRONG }}
                            className="display display-tight text-[#1d1d1f] text-[48px] sm:text-[72px] lg:text-[88px]"
                        >
                            The path to <br />
                            AI excellence.
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.18, ease: APPLE_EASE }}
                            className="mx-auto mt-6 max-w-2xl text-[19px] sm:text-[21px] leading-[1.4] text-[#6e6e73] [text-wrap:balance]"
                        >
                            Transforming your business with AI isn&apos;t about chasing trends. It&apos;s a structured, data-driven approach to efficiency and growth.
                        </motion.p>
                    </div>

                    {/* Steps — alternating layout, Apple-restrained */}
                    <div className="space-y-32 sm:space-y-40">
                        {steps.map((step, i) => (
                            <motion.section
                                key={step.number}
                                initial={{ opacity: 0, y: 24 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-20%' }}
                                transition={{ duration: 0.8, ease: APPLE_EASE_STRONG }}
                                className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20`}
                            >
                                {/* Visual side */}
                                <div className="flex-1 w-full">
                                    <div className="relative aspect-[4/3] rounded-[28px] bg-[#f5f5f7] overflow-hidden flex items-center justify-center">
                                        <div className="absolute top-0 right-0 p-8">
                                            <span className="text-[120px] font-semibold tracking-tighter text-[#1d1d1f]/[0.06] leading-none">
                                                {step.number}
                                            </span>
                                        </div>
                                        <step.icon className="h-20 w-20 text-[#1d1d1f]/30" strokeWidth={1.2} />
                                    </div>
                                </div>

                                {/* Content side */}
                                <div className="flex-1">
                                    <div className="eyebrow mb-4">Step {step.number}</div>
                                    <h2 className="display display-tight text-[#1d1d1f] text-[36px] sm:text-[48px] mb-6">
                                        {step.title}
                                    </h2>
                                    <p className="text-[19px] leading-[1.45] text-[#6e6e73] mb-8 [text-wrap:balance]">
                                        {step.desc}
                                    </p>
                                    <ul className="space-y-3">
                                        {step.features.map((feature, idx) => (
                                            <li key={idx} className="flex items-center gap-3">
                                                <CheckCircle2 className="h-4 w-4 text-[#1d1d1f]/60" strokeWidth={1.5} />
                                                <span className="text-[15px] text-[#1d1d1f]">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.section>
                        ))}
                    </div>

                    {/* Success stories */}
                    <div className="mt-40 sm:mt-48">
                        <div className="text-center mb-16">
                            <div className="eyebrow mb-3">Success stories</div>
                            <h3 className="display display-tight text-[#1d1d1f] text-[40px] sm:text-[56px]">
                                Real results for real SMBs.
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            {successStories.map((story, i) => (
                                <motion.div
                                    key={story.company}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-15%' }}
                                    transition={{ delay: i * 0.08, duration: 0.7, ease: APPLE_EASE }}
                                    className="lift p-8 rounded-[22px] bg-white border hairline"
                                >
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] text-[#86868b]">{story.industry}</span>
                                            <span className="text-[17px] font-semibold text-[#1d1d1f] tracking-tight">{story.company}</span>
                                        </div>
                                        <TrendingUp className="h-5 w-5 text-[#1d1d1f]/40" strokeWidth={1.5} />
                                    </div>

                                    <div className="space-y-5">
                                        <div>
                                            <p className="eyebrow mb-1.5">Challenge</p>
                                            <p className="text-[14px] leading-[1.5] text-[#1d1d1f]/80">{story.challenge}</p>
                                        </div>
                                        <div>
                                            <p className="eyebrow mb-1.5">Solution</p>
                                            <p className="text-[14px] leading-[1.5] text-[#1d1d1f]/80">{story.solution}</p>
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-6 border-t hairline">
                                        <p className="display display-tight text-[#1d1d1f] text-[22px] mb-1">{story.result}</p>
                                        <p className="text-[12px] text-[#6e6e73]">{story.metric}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Final CTA */}
                    <motion.section
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-20%' }}
                        transition={{ duration: 0.8, ease: APPLE_EASE_STRONG }}
                        className="mt-40 text-center py-24 rounded-[32px] bg-[#f5f5f7]"
                    >
                        <h2 className="display display-tight text-[#1d1d1f] text-[40px] sm:text-[64px] mb-8 px-6">
                            Ready to see your AI roadmap?
                        </h2>
                        <Link href="/auth" className="apple-pill apple-pill-accent">
                            Start free AI audit
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </motion.section>
                </div>
            </main>

            <footer className="border-t hairline bg-[#f5f5f7] py-10 text-center text-[11px] text-[#86868b]">
                © 2026 AUDCOMP Information Technology Solutions. All rights reserved.
            </footer>
        </div>
    );
}
