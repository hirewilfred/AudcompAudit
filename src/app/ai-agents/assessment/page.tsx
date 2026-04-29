'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { AGENT_ASSESSMENT_STEPS, AgentAssessmentResponses, recommendAgents } from '@/lib/agent-assessment';
import { createClient } from '@/lib/supabase/client';
import SiteNav from '@/components/SiteNav';

export default function AgentAssessmentPage() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState(0);
    const [responses, setResponses] = useState<AgentAssessmentResponses>({});
    const [submitting, setSubmitting] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/auth?next=/ai-agents/assessment'); return; }
            setAuthChecked(true);
        })();
    }, []);

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
            if (!session) { router.push('/auth'); return; }

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

            router.push('/dashboard?aa=1');
        } catch (err) {
            console.error('Agent assessment save failed', err);
            alert('Could not save your assessment — please try again.');
            setSubmitting(false);
        }
    };

    if (!authChecked) {
        return (
            <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800 selection:bg-blue-600/10">

            {/* Soft brand glow */}
            <div className="fixed top-[-15%] right-[-10%] h-[500px] w-[500px] rounded-full bg-blue-300/30 blur-[140px] pointer-events-none" />
            <div className="fixed bottom-[-15%] left-[-10%] h-[400px] w-[400px] rounded-full bg-indigo-200/40 blur-[140px] pointer-events-none" />

            <SiteNav activeCta="agents" />

            {/* Sub-header — step counter */}
            <div className="relative z-10 border-b border-slate-200/60 bg-white/70 backdrop-blur">
                <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <Sparkles className="h-3.5 w-3.5 text-blue-600" />
                        AI Agent Assessment · 5 questions · ~5 minutes
                    </div>
                    <div className="text-xs font-bold text-slate-500">
                        Step <span className="text-slate-900 font-black">{step + 1}</span> of {totalSteps}
                    </div>
                </div>
            </div>

            <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">

                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden mb-12">
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                    />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -16 }}
                        transition={{ duration: 0.25 }}
                    >
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-3">Question {step + 1}</div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-3 leading-[1.05]">{currentStep.title}</h1>
                        <p className="text-base text-slate-600 mb-10 leading-relaxed font-medium">{currentStep.subtitle}</p>

                        {currentStep.fields.map(field => (
                            <div key={field.id} className="mb-10">
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-4">{field.label}</label>

                                {field.type === 'radio' && (
                                    <div className="grid gap-3">
                                        {field.options.map(opt => {
                                            const active = responses[field.id] === opt.value;
                                            return (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => setRadio(field.id, opt.value)}
                                                    className={`text-left rounded-2xl border-2 px-5 py-4 transition-all ${
                                                        active
                                                            ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-100 shadow-md shadow-blue-600/10'
                                                            : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 shadow-sm'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${active ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`}>
                                                            {active && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-sm font-black tracking-tight ${active ? 'text-blue-900' : 'text-slate-800'}`}>{opt.label}</div>
                                                            {opt.description && <div className={`text-xs mt-0.5 leading-relaxed ${active ? 'text-blue-700' : 'text-slate-500'}`}>{opt.description}</div>}
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
                                                    className={`text-left rounded-2xl border-2 px-4 py-3 transition-all ${
                                                        active
                                                            ? 'bg-blue-50 border-blue-500 ring-4 ring-blue-100 shadow-md shadow-blue-600/10'
                                                            : 'bg-white border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 shadow-sm'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${active ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'}`}>
                                                            {active && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-sm font-black tracking-tight ${active ? 'text-blue-900' : 'text-slate-800'}`}>{opt.label}</div>
                                                            {opt.description && <div className={`text-xs mt-0.5 leading-relaxed ${active ? 'text-blue-700' : 'text-slate-500'}`}>{opt.description}</div>}
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

                {/* Nav */}
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-slate-200">
                    <button
                        onClick={() => step > 0 && setStep(s => s - 1)}
                        disabled={step === 0}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>

                    {step < totalSteps - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!isStepComplete}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-300 disabled:to-slate-300 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-md shadow-blue-600/20 transition-all"
                        >
                            Next
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!isStepComplete || submitting}
                            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:from-slate-300 disabled:to-slate-300 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-md shadow-blue-600/20 transition-all"
                        >
                            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                            {submitting ? 'Saving…' : 'See My Agent Team'}
                        </button>
                    )}
                </div>
            </main>
        </div>
    );
}
