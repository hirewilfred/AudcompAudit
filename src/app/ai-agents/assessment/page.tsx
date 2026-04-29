'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { AGENT_ASSESSMENT_STEPS, AgentAssessmentResponses, recommendAgents } from '@/lib/agent-assessment';
import { createClient } from '@/lib/supabase/client';

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

            // Read any existing report so we don't overwrite the audit data.
            const { data: existing } = await (supabase
                .from('ai_advisor_reports') as any)
                .select('responses')
                .eq('user_id', session.user.id)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            const merged = { ...(existing?.responses ?? {}), ...responses, aa_recommended_agent_ids: recommendation.agents.map(a => a.id), aa_recommended_package: recommendation.package };

            // Try upsert; fall back to insert if no row exists yet.
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
            <div className="min-h-screen bg-[#050B1A] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050B1A] text-white relative overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
            <div className="fixed top-0 right-0 h-[600px] w-[600px] rounded-full bg-violet-600/15 blur-[140px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />

            {/* Header */}
            <header className="relative z-10 px-8 py-5 flex items-center justify-between border-b border-white/5">
                <Link href="/ai-agents" className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center">
                        <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-black text-sm">AI Agent Assessment</span>
                </Link>
                <div className="text-xs font-bold text-slate-500">
                    Step <span className="text-white">{step + 1}</span> of {totalSteps}
                </div>
            </header>

            <main className="relative z-10 max-w-3xl mx-auto px-6 py-12">
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-10">
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
                    />
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">{currentStep.title}</h1>
                        <p className="text-base text-slate-400 mb-10 leading-relaxed">{currentStep.subtitle}</p>

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
                                                            ? 'bg-violet-500/10 border-violet-400/60 ring-2 ring-violet-400/30'
                                                            : 'bg-white/3 border-white/10 hover:bg-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? 'border-violet-400 bg-violet-400' : 'border-slate-600'}`}>
                                                            {active && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-sm font-black ${active ? 'text-white' : 'text-slate-200'}`}>{opt.label}</div>
                                                            {opt.description && <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>}
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
                                                            ? 'bg-cyan-500/10 border-cyan-400/60 ring-2 ring-cyan-400/30'
                                                            : 'bg-white/3 border-white/10 hover:bg-white/5 hover:border-white/20'
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 ${active ? 'border-cyan-400 bg-cyan-400' : 'border-slate-600'}`}>
                                                            {active && <CheckCircle2 className="h-3 w-3 text-white" />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-sm font-black ${active ? 'text-white' : 'text-slate-200'}`}>{opt.label}</div>
                                                            {opt.description && <div className="text-xs text-slate-500 mt-0.5">{opt.description}</div>}
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
                <div className="flex items-center justify-between mt-10 pt-6 border-t border-white/5">
                    <button
                        onClick={() => step > 0 && setStep(s => s - 1)}
                        disabled={step === 0}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>

                    {step < totalSteps - 1 ? (
                        <button
                            onClick={() => setStep(s => s + 1)}
                            disabled={!isStepComplete}
                            className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-lg shadow-violet-500/20 transition-all"
                        >
                            Next
                            <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!isStepComplete || submitting}
                            className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 disabled:from-slate-700 disabled:to-slate-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-lg shadow-violet-500/20 transition-all"
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
