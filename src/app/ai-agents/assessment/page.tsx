'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { AGENT_ASSESSMENT_STEPS, AgentAssessmentResponses, recommendAgents } from '@/lib/agent-assessment';
import { createClient } from '@/lib/supabase/client';
import SiteNav from '@/components/SiteNav';

const PENDING_KEY = 'aa_pending_responses';

export default function AgentAssessmentPage() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState(0);
    const [responses, setResponses] = useState<AgentAssessmentResponses>({});
    const [submitting, setSubmitting] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    // Hydrate any in-flight responses from a previous (pre-auth) session.
    useEffect(() => {
        try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem(PENDING_KEY) : null;
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && typeof parsed === 'object') setResponses(parsed);
            }
        } catch {}
        setHydrated(true);
    }, []);

    // Persist responses locally so they survive an auth round-trip.
    useEffect(() => {
        if (!hydrated) return;
        try { localStorage.setItem(PENDING_KEY, JSON.stringify(responses)); } catch {}
    }, [responses, hydrated]);

    // After returning from auth with `pending=1`, auto-submit if responses are complete.
    useEffect(() => {
        if (!hydrated) return;
        const url = new URL(window.location.href);
        if (url.searchParams.get('pending') !== '1') return;
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const allComplete = AGENT_ASSESSMENT_STEPS.every(s =>
                s.fields.every(f => {
                    const v = responses[f.id];
                    if (f.type === 'multiselect') return Array.isArray(v) && v.length > 0;
                    return typeof v === 'string' && v.length > 0;
                })
            );
            if (allComplete) {
                handleSubmit();
            } else {
                // Jump to the first incomplete step.
                const idx = AGENT_ASSESSMENT_STEPS.findIndex(s =>
                    s.fields.some(f => {
                        const v = responses[f.id];
                        if (f.type === 'multiselect') return !Array.isArray(v) || v.length === 0;
                        return typeof v !== 'string' || v.length === 0;
                    })
                );
                if (idx >= 0) setStep(idx);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hydrated]);

    const totalSteps = AGENT_ASSESSMENT_STEPS.length;
    const currentStep = AGENT_ASSESSMENT_STEPS[step];
    const progress = Math.round(((step + 1) / totalSteps) * 100);

    const setRadio = (id: string, value: string) => setResponses(p => ({ ...p, [id]: value }));
    const toggleMulti = (id: string, value: string) => {
        setResponses(p => {
            const cur = (p[id] as string[]) || [];
            return { ...p, [id]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] };
        });
    };

    const isStepComplete = currentStep.fields.every(f => {
        const v = responses[f.id];
        if (f.type === 'multiselect') return Array.isArray(v) && v.length > 0;
        return typeof v === 'string' && v.length > 0;
    });

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // Stash answers locally and send the user to create an account.
                try { localStorage.setItem(PENDING_KEY, JSON.stringify(responses)); } catch {}
                router.push('/auth?mode=signup&next=' + encodeURIComponent('/ai-agents/assessment?pending=1'));
                return;
            }

            const recommendation = recommendAgents(responses);

            const { data: existing } = await (supabase
                .from('ai_advisor_reports') as any)
                .select('responses')
                .eq('user_id', session.user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const merged = {
                ...(existing?.responses ?? {}),
                ...responses,
                aa_recommended_agent_ids: recommendation.agents.map(a => a.id),
                aa_recommended_package: recommendation.package,
            };

            const { error: upsertErr } = await (supabase.from('ai_advisor_reports') as any)
                .upsert({
                    user_id: session.user.id,
                    responses: merged,
                    updated_at: new Date().toISOString(),
                }, { onConflict: 'user_id' });

            if (upsertErr) {
                await (supabase.from('ai_advisor_reports') as any).insert({
                    user_id: session.user.id,
                    responses: merged,
                });
            }

            try { localStorage.removeItem(PENDING_KEY); } catch {}
            router.push('/dashboard?aa=1');
        } catch (err) {
            console.error('Agent assessment save failed', err);
            alert('Could not save your assessment — please try again.');
            setSubmitting(false);
        }
    };

    if (!hydrated) {
        return (
            <div className="min-h-screen bg-[#fbfbfd] flex items-center justify-center">
                <Loader2 className="h-6 w-6 text-[#1d1d1f]/40 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
            <SiteNav activeCta="agents" />

            <div className="border-b hairline bg-white/72 backdrop-blur-xl">
                <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="text-[12px] text-[#6e6e73]">
                        AI Agent Assessment · 5 questions · ~5 minutes
                    </div>
                    <div className="flex items-center gap-3 text-[12px] text-[#6e6e73]">
                        <span>Step {step + 1} of {totalSteps}</span>
                        <div className="w-20 h-1 bg-[#1d1d1f]/8 rounded-full overflow-hidden">
                            <motion.div
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full bg-[#1d1d1f]"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-6 py-16 sm:py-20">

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div className="eyebrow mb-3">Question {step + 1}</div>
                        <h1 className="display display-tight text-[#1d1d1f] text-[36px] sm:text-[52px] mb-3 [text-wrap:balance]">{currentStep.title}</h1>
                        <p className="text-[19px] text-[#6e6e73] mb-12 leading-[1.45]">{currentStep.subtitle}</p>

                        {currentStep.fields.map(field => (
                            <div key={field.id} className="mb-10">
                                <label className="eyebrow block mb-4">{field.label}</label>

                                {field.type === 'radio' && (
                                    <div className="grid gap-3">
                                        {field.options.map(opt => {
                                            const active = responses[field.id] === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setRadio(field.id, opt.value)}
                                                    className={`text-left rounded-[18px] border px-5 py-4 transition-all duration-200 ${
                                                        active
                                                            ? 'bg-white border-[#1d1d1f]'
                                                            : 'bg-white border-transparent hover:border-[#1d1d1f]/15'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${active ? 'border-[#1d1d1f] bg-[#1d1d1f]' : 'border-[#1d1d1f]/20 bg-transparent'}`}>
                                                            {active && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={2} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[15px] font-medium tracking-tight text-[#1d1d1f]">{opt.label}</div>
                                                            {opt.description && <div className="text-[13px] mt-1 leading-[1.5] text-[#6e6e73]">{opt.description}</div>}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {field.type === 'multiselect' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {field.options.map(opt => {
                                            const arr = (responses[field.id] as string[]) || [];
                                            const active = arr.includes(opt.value);
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => toggleMulti(field.id, opt.value)}
                                                    className={`text-left rounded-[16px] border px-4 py-3 transition-all duration-200 ${
                                                        active
                                                            ? 'bg-white border-[#1d1d1f]'
                                                            : 'bg-white border-transparent hover:border-[#1d1d1f]/15'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 h-5 w-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${active ? 'border-[#1d1d1f] bg-[#1d1d1f]' : 'border-[#1d1d1f]/20 bg-transparent'}`}>
                                                            {active && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={2} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-[14px] font-medium tracking-tight text-[#1d1d1f]">{opt.label}</div>
                                                            {opt.description && <div className="text-[12px] mt-1 leading-[1.5] text-[#6e6e73]">{opt.description}</div>}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-12 pt-8 border-t hairline">
                    <button
                        onClick={() => step > 0 && setStep(s => s - 1)}
                        disabled={step === 0}
                        className="apple-pill apple-pill-ghost disabled:opacity-0"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>

                    {step < totalSteps - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!isStepComplete}
                            className="apple-pill apple-pill-primary disabled:opacity-40"
                        >
                            Next
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!isStepComplete || submitting}
                            className="apple-pill apple-pill-primary disabled:opacity-40"
                        >
                            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />}
                            {submitting ? 'Saving…' : 'See my agent team'}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
