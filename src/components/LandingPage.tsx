'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowRight, CheckCircle2, Loader2, AlertCircle, Phone, Mail,
} from 'lucide-react';
import SiteNav from '@/components/SiteNav';

const APPLE_EASE = [0.22, 1, 0.36, 1] as const;
const APPLE_EASE_STRONG = [0.16, 1, 0.3, 1] as const;

export interface LandingPageConfig {
    slug: 'free-ai-audit' | 'ai-receptionist' | 'custom-ai-agents' | 'ai-training' | 'audcomp-360';
    eyebrow: string;
    headlineLead: string;
    headlineAccent: string;
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
    formCtaTitle: string;
    formCtaSub: string;
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
        <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
            <SiteNav />

            {/* HERO — Apple light, split with form */}
            <section className="relative overflow-hidden bg-[#fbfbfd]">
                <div className="relative max-w-[1024px] mx-auto px-6 py-24 sm:py-32 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
                    <div className="lg:col-span-7">
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: APPLE_EASE }}
                            className="eyebrow mb-5"
                        >
                            {cfg.eyebrow}
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.9, ease: APPLE_EASE_STRONG }}
                            className="display display-tight text-[44px] sm:text-[64px] lg:text-[76px] text-[#1d1d1f] mb-5"
                        >
                            {cfg.headlineLead}{' '}
                            <span className="text-[#f97316]">{cfg.headlineAccent}</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.15, ease: APPLE_EASE }}
                            className="text-[19px] leading-[1.4] text-[#6e6e73] mb-8 max-w-2xl [text-wrap:balance]"
                        >
                            {cfg.subhead}
                        </motion.p>

                        <motion.ul
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.28, ease: APPLE_EASE }}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mb-10"
                        >
                            {cfg.heroBullets.map(b => (
                                <li key={b} className="flex items-start gap-2 text-[14px] text-[#1d1d1f]/85">
                                    <CheckCircle2 className="h-4 w-4 text-[#1d1d1f]/50 mt-0.5 shrink-0" strokeWidth={1.5} />
                                    <span>{b}</span>
                                </li>
                            ))}
                        </motion.ul>

                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: APPLE_EASE }}
                            className="flex flex-wrap items-center gap-3"
                        >
                            <a href="#capture" className="apple-pill apple-pill-accent">
                                {cfg.primaryCtaLabel} <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                            {cfg.secondaryCtaLabel && cfg.secondaryCtaHref && (
                                <a
                                    href={cfg.secondaryCtaHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="apple-pill apple-pill-ghost"
                                >
                                    {cfg.secondaryCtaLabel}
                                </a>
                            )}
                        </motion.div>
                    </div>

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
            <section className="bg-[#f5f5f7] py-28 sm:py-36">
                <div className="max-w-[1024px] mx-auto px-6">
                    <div className="text-center mb-16">
                        <div className="eyebrow mb-3">The problem</div>
                        <motion.h2
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-20%' }}
                            transition={{ duration: 0.7, ease: APPLE_EASE_STRONG }}
                            className="display display-tight text-[#1d1d1f] text-[40px] sm:text-[56px] max-w-2xl mx-auto"
                        >
                            Where Canadian businesses bleed hours every week.
                        </motion.h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-5">
                        {cfg.problems.map((p, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 16 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-15%' }}
                                transition={{ delay: i * 0.08, duration: 0.7, ease: APPLE_EASE }}
                                className="lift bg-white rounded-[22px] p-8 border hairline"
                            >
                                <div className="h-10 w-10 rounded-full bg-[#1d1d1f]/[0.04] flex items-center justify-center text-[#1d1d1f] mb-5">
                                    <p.icon className="h-4 w-4" strokeWidth={1.5} />
                                </div>
                                <h3 className="text-[19px] font-semibold tracking-tight text-[#1d1d1f] mb-2">{p.title}</h3>
                                <p className="text-[14px] leading-[1.55] text-[#6e6e73]">{p.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SOLUTION + OUTCOMES */}
            <section className="bg-[#fbfbfd] py-28 sm:py-36">
                <div className="max-w-[1024px] mx-auto px-6">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-20%' }}
                        transition={{ duration: 0.8, ease: APPLE_EASE_STRONG }}
                        className="rounded-[32px] bg-[#1d1d1f] text-white p-12 md:p-16 relative overflow-hidden"
                    >
                        <div className="relative grid lg:grid-cols-12 gap-12 items-start">
                            <div className="lg:col-span-7">
                                <div className="text-[13px] text-white/60 mb-4">How Audcomp fixes it</div>
                                <h2 className="display display-tight text-[36px] sm:text-[52px] mb-8 text-white">
                                    {cfg.solution.title}
                                </h2>
                                <ul className="space-y-3">
                                    {cfg.solution.bullets.map(b => (
                                        <li key={b} className="flex items-start gap-3">
                                            <CheckCircle2 className="h-4 w-4 text-white/70 shrink-0 mt-1" strokeWidth={1.5} />
                                            <span className="text-[15px] text-white/85 leading-[1.5]">{b}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="lg:col-span-5 grid grid-cols-2 gap-3">
                                {cfg.outcomes.map(o => (
                                    <div key={o.label} className="bg-white/[0.06] backdrop-blur rounded-[18px] p-5">
                                        <div className="display display-tight text-[34px] sm:text-[40px] text-white mb-1">{o.metric}</div>
                                        <div className="text-[12px] text-white/60">{o.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* PROOF */}
            {cfg.proof && cfg.proof.length > 0 && (
                <section className="bg-[#f5f5f7] py-28 sm:py-36">
                    <div className="max-w-[1024px] mx-auto px-6">
                        <div className="text-center mb-16">
                            <div className="eyebrow mb-3">From the field</div>
                            <h2 className="display display-tight text-[#1d1d1f] text-[40px] sm:text-[56px]">What clients are saying.</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-5">
                            {cfg.proof.map((p, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-15%' }}
                                    transition={{ delay: i * 0.08, duration: 0.7, ease: APPLE_EASE }}
                                    className="lift bg-white rounded-[22px] p-8 border hairline"
                                >
                                    <p className="text-[16px] text-[#1d1d1f] leading-[1.55] mb-6">&ldquo;{p.quote}&rdquo;</p>
                                    <div className="text-[14px] font-semibold text-[#1d1d1f]">{p.name}</div>
                                    <div className="text-[12px] text-[#6e6e73]">{p.title}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FAQ */}
            {cfg.faq && cfg.faq.length > 0 && (
                <section className="bg-[#fbfbfd] py-28 sm:py-36">
                    <div className="max-w-2xl mx-auto px-6">
                        <div className="text-center mb-12">
                            <div className="eyebrow mb-3">FAQ</div>
                            <h2 className="display display-tight text-[#1d1d1f] text-[36px] sm:text-[48px]">Common questions.</h2>
                        </div>
                        <div className="space-y-2">
                            {cfg.faq.map((f, i) => (
                                <details key={i} className="group bg-white rounded-[18px] border hairline p-6 transition-shadow open:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]">
                                    <summary className="font-semibold text-[#1d1d1f] cursor-pointer flex items-center justify-between gap-3 text-[16px] tracking-tight list-none">
                                        {f.q}
                                        <ArrowRight className="h-4 w-4 text-[#1d1d1f]/40 transition-transform duration-300 group-open:rotate-90" />
                                    </summary>
                                    <p className="mt-4 text-[14px] text-[#6e6e73] leading-[1.55]">{f.a}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* FINAL CTA */}
            <section className="bg-[#fbfbfd] pb-32">
                <div className="max-w-[1024px] mx-auto px-6">
                    <FormCard cfg={cfg} onSubmit={onSubmit} submitting={submitting} submitted={submitted} error={error} compact />
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t hairline bg-[#f5f5f7] py-10">
                <div className="max-w-[1024px] mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-[12px] text-[#6e6e73]">
                    <div className="flex items-center gap-3">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-5 opacity-70" />
                        <span>© 2026 Audcomp Computer Systems Ltd.</span>
                    </div>
                    <div className="flex items-center gap-5">
                        <a href="https://audcomp.com" className="hover:text-[#1d1d1f] transition-colors">audcomp.com</a>
                        <a href="mailto:hello@audcomp.com" className="hover:text-[#1d1d1f] transition-colors inline-flex items-center gap-1.5"><Mail className="h-3 w-3" /> hello@audcomp.com</a>
                        <a href="tel:+19055475262" className="hover:text-[#1d1d1f] transition-colors inline-flex items-center gap-1.5"><Phone className="h-3 w-3" /> 905-547-5262</a>
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
            className={`bg-white rounded-[24px] border hairline shadow-[0_24px_70px_-30px_rgba(0,0,0,0.12)] p-8 ${compact ? 'max-w-xl mx-auto' : ''}`}
        >
            <div className="eyebrow mb-2">Free · No credit card</div>
            <h3 className="display display-tight text-[#1d1d1f] text-[24px] sm:text-[28px] mb-2 [text-wrap:balance]">{cfg.formCtaTitle}</h3>
            <p className="text-[14px] text-[#6e6e73] mb-6 leading-[1.5]">{cfg.formCtaSub}</p>

            {submitted ? (
                <div className="rounded-[18px] bg-[#f5f5f7] p-8 text-center">
                    <CheckCircle2 className="h-9 w-9 text-[#1d1d1f] mx-auto mb-3" strokeWidth={1.5} />
                    <h4 className="text-[18px] font-semibold text-[#1d1d1f] mb-1 tracking-tight">{cfg.successHeadline}</h4>
                    <p className="text-[14px] text-[#6e6e73] leading-[1.5]">{cfg.successBody}</p>
                </div>
            ) : (
                <form onSubmit={onSubmit} className="space-y-3">
                    {error && (
                        <div className="flex items-center gap-2 rounded-[12px] bg-red-50 border border-red-100 px-3 py-2 text-[12px] text-red-700">
                            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {error}
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            name="full_name"
                            placeholder="Full name"
                            required
                            className="rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5"
                        />
                        <input
                            name="organization"
                            placeholder="Company"
                            className="rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5"
                        />
                    </div>
                    <input
                        type="email"
                        name="email"
                        placeholder="Work email"
                        required
                        className="w-full rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5"
                    />
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Phone (optional)"
                        className="w-full rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5"
                    />
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full apple-pill apple-pill-accent justify-center py-3.5 disabled:opacity-60"
                    >
                        {submitting
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <>{cfg.primaryCtaLabel} <ArrowRight className="h-3.5 w-3.5" /></>
                        }
                    </button>
                    <p className="text-[11px] text-[#86868b] text-center">
                        We&apos;ll route you to the right Audcomp expert. No spam.
                    </p>
                </form>
            )}
        </div>
    );
}
