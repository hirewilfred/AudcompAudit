'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    ArrowRight, CheckCircle2, Sparkles, Shield, Loader2, AlertCircle, Phone, Mail,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';

export interface LandingPageConfig {
    slug: 'free-ai-audit' | 'ai-receptionist' | 'custom-ai-agents' | 'ai-training' | 'audcomp-360';
    eyebrow: string;
    headlineLead: string;
    headlineAccent: string;          // gets the gradient pop
    subhead: string;
    heroBullets: string[];
    primaryCtaLabel: string;
    secondaryCtaLabel?: string;
    secondaryCtaHref?: string;
    problems: { icon: any; title: string; body: string }[];
    solution: { title: string; bullets: string[] };
    outcomes: { metric: string; label: string }[];
    proof?: { quote: string; name: string; title: string }[];
    faq?: { q: string; a: string }[];
    formCtaTitle: string;            // headline above the form
    formCtaSub: string;              // sub above the form
    successHeadline: string;
    successBody: string;
}

export default function LandingPage({ cfg }: { cfg: LandingPageConfig }) {
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const fd = new FormData(e.currentTarget);
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');

        try {
            const res = await fetch('/api/landing/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    landing_page_slug: cfg.slug,
                    email: fd.get('email'),
                    full_name: fd.get('full_name'),
                    organization: fd.get('organization'),
                    phone: fd.get('phone'),
                    referrer: typeof document !== 'undefined' ? document.referrer || null : null,
                    utm_source: params.get('utm_source'),
                    utm_medium: params.get('utm_medium'),
                    utm_campaign: params.get('utm_campaign'),
                    utm_term: params.get('utm_term'),
                    utm_content: params.get('utm_content'),
                }),
            });
            if (!res.ok) {
                const j = await res.json().catch(() => ({}));
                setError(j.error || 'Submission failed — try again.');
                setSubmitting(false);
                return;
            }
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || 'Network error');
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-900 selection:bg-blue-600/10">
            <SiteNav />

            {/* HERO */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900" />
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.4) 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-blue-500/30 blur-[140px] pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-indigo-500/20 blur-[140px] pointer-events-none" />

                <div className="relative max-w-7xl mx-auto px-6 lg:px-12 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-5 bg-white/5 border border-white/10 backdrop-blur px-3 py-1.5 rounded-full"
                        >
                            <Sparkles className="h-3 w-3" /> {cfg.eyebrow}
                        </motion.div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.02] mb-5">
                            {cfg.headlineLead}{' '}
                            <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">
                                {cfg.headlineAccent}
                            </span>
                        </h1>
                        <p className="text-blue-100/80 text-lg leading-relaxed mb-8 max-w-2xl">
                            {cfg.subhead}
                        </p>

                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mb-8">
                            {cfg.heroBullets.map(b => (
                                <li key={b} className="flex items-start gap-2 text-sm text-blue-100">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                                    <span>{b}</span>
                                </li>
                            ))}
                        </ul>

                        <div className="flex flex-wrap items-center gap-3">
                            <a
                                href="#capture"
                                className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-full shadow-lg shadow-orange-600/30 transition-colors"
                            >
                                {cfg.primaryCtaLabel} <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                            {cfg.secondaryCtaLabel && cfg.secondaryCtaHref && (
                                <a
                                    href={cfg.secondaryCtaHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 bg-white/10 backdrop-blur hover:bg-white/15 text-white border border-white/20 font-black uppercase tracking-widest text-xs px-6 py-4 rounded-full transition-colors"
                                >
                                    {cfg.secondaryCtaLabel}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Form card sits in the hero */}
                    <div className="lg:col-span-5">
                        <FormCard
                            id="capture"
                            cfg={cfg}
                            onSubmit={onSubmit}
                            submitting={submitting}
                            submitted={submitted}
                            error={error}
                        />
                    </div>
                </div>
            </section>

            {/* PROBLEMS */}
            <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
                <div className="text-center mb-12">
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3">The Problem</div>
                    <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight max-w-3xl mx-auto">
                        Where Canadian businesses are bleeding hours every week.
                    </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-5">
                    {cfg.problems.map((p, i) => (
                        <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
                            <div className="h-12 w-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mb-5">
                                <p.icon className="h-5 w-5" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 mb-2 leading-tight">{p.title}</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">{p.body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* SOLUTION */}
            <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
                <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-10 md:p-16 relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.5) 1px, transparent 0)',
                            backgroundSize: '20px 20px',
                        }}
                    />
                    <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-white/10 blur-[100px]" />
                    <div className="relative grid lg:grid-cols-12 gap-10 items-center">
                        <div className="lg:col-span-7">
                            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 mb-3">How Audcomp Fixes It</div>
                            <h2 className="text-3xl md:text-5xl font-black leading-tight mb-6">{cfg.solution.title}</h2>
                            <ul className="space-y-3">
                                {cfg.solution.bullets.map(b => (
                                    <li key={b} className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-300 shrink-0 mt-0.5" />
                                        <span className="text-base text-blue-50 leading-relaxed">{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                            {cfg.outcomes.map(o => (
                                <div key={o.label} className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-5">
                                    <div className="text-3xl md:text-4xl font-black tabular-nums leading-none mb-1">{o.metric}</div>
                                    <div className="text-[11px] font-black uppercase tracking-widest text-blue-100">{o.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* PROOF */}
            {cfg.proof && cfg.proof.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 lg:px-12 py-20">
                    <div className="text-center mb-10">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3">From the Field</div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight">What clients are saying.</h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                        {cfg.proof.map((p, i) => (
                            <div key={i} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-7">
                                <p className="text-base text-slate-800 leading-relaxed mb-6">"{p.quote}"</p>
                                <div className="text-sm font-black text-slate-900">{p.name}</div>
                                <div className="text-xs text-slate-500">{p.title}</div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* FAQ */}
            {cfg.faq && cfg.faq.length > 0 && (
                <section className="max-w-3xl mx-auto px-6 lg:px-12 py-20">
                    <div className="text-center mb-10">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3">FAQ</div>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">Common questions.</h2>
                    </div>
                    <div className="space-y-3">
                        {cfg.faq.map((f, i) => (
                            <details key={i} className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-5 open:shadow-md transition-shadow">
                                <summary className="font-black text-slate-900 cursor-pointer flex items-center justify-between gap-3">
                                    {f.q}
                                    <ArrowRight className="h-4 w-4 text-blue-600 transition-transform group-open:rotate-90" />
                                </summary>
                                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{f.a}</p>
                            </details>
                        ))}
                    </div>
                </section>
            )}

            {/* FINAL CTA */}
            <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-24">
                <FormCard cfg={cfg} onSubmit={onSubmit} submitting={submitting} submitted={submitted} error={error} compact />
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-10">
                <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-7 opacity-80" />
                        <span>© 2026 Audcomp Computer Systems Ltd.</span>
                    </div>
                    <div className="flex items-center gap-5">
                        <a href="https://audcomp.com" className="hover:text-white">audcomp.com</a>
                        <a href="mailto:hello@audcomp.com" className="hover:text-white inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> hello@audcomp.com</a>
                        <a href="tel:+19055475262" className="hover:text-white inline-flex items-center gap-1.5"><Phone className="h-3 w-3" /> 905-547-5262</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function FormCard({
    id, cfg, onSubmit, submitting, submitted, error, compact = false,
}: {
    id?: string;
    cfg: LandingPageConfig;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    submitting: boolean;
    submitted: boolean;
    error: string | null;
    compact?: boolean;
}) {
    return (
        <div
            id={id}
            className={`bg-white rounded-3xl border border-slate-100 shadow-2xl p-7 ${compact ? 'max-w-2xl mx-auto' : ''}`}
        >
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-2 inline-flex items-center gap-1.5">
                <Shield className="h-3 w-3" /> Free · No credit card
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-2">{cfg.formCtaTitle}</h3>
            <p className="text-sm text-slate-600 mb-6">{cfg.formCtaSub}</p>

            {submitted ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-3" />
                    <h4 className="text-lg font-black text-slate-900 mb-1">{cfg.successHeadline}</h4>
                    <p className="text-sm text-slate-600">{cfg.successBody}</p>
                </div>
            ) : (
                <form onSubmit={onSubmit} className="space-y-3">
                    {error && (
                        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            name="full_name"
                            placeholder="Full name"
                            required
                            className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                        <input
                            name="organization"
                            placeholder="Company"
                            className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <input
                        type="email"
                        name="email"
                        placeholder="Work email"
                        required
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone (optional)"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-xl shadow-lg shadow-orange-600/30 transition-colors"
                    >
                        {submitting
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <>{cfg.primaryCtaLabel} <ArrowRight className="h-3.5 w-3.5" /></>
                        }
                    </button>
                    <p className="text-[11px] text-slate-500 text-center">
                        We'll route you to the right Audcomp expert. No spam, no upsells you didn't ask for.
                    </p>
                </form>
            )}
        </div>
    );
}
