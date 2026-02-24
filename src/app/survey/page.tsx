'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AUDIT_QUESTIONS } from '@/lib/audit-questions';
import { ChevronRight, ChevronLeft, Sparkles, CheckCircle2, Loader2, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { calculateAuditResults } from '@/lib/scoring';
import { Database } from '@/lib/database.types';

type AuditResponsesInsert = Database['public']['Tables']['audit_responses']['Insert'];
type AuditScoresInsert = Database['public']['Tables']['audit_scores']['Insert'];

export default function SurveyPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isFinishing, setIsFinishing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function checkAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/auth');
            } else {
                setIsCheckingAuth(false);
            }
        }
        checkAuth();
    }, []);

    const currentQuestion = AUDIT_QUESTIONS[currentStep];
    const progress = ((currentStep + 1) / AUDIT_QUESTIONS.length) * 100;

    const handleSelect = (value: number) => {
        setAnswers({ ...answers, [currentQuestion.id]: value });
    };

    const nextStep = () => {
        if (currentStep < AUDIT_QUESTIONS.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            finishAudit();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const finishAudit = async () => {
        setIsFinishing(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (user) {
                const { categoryScores, overallScore } = calculateAuditResults(answers);

                // 1. Save all responses
                const responseData: AuditResponsesInsert[] = Object.entries(answers).map(([qId, val]) => ({
                    user_id: user.id,
                    question_id: qId,
                    answer: val
                }));

                const { error: respError } = await supabase
                    .from('audit_responses')
                    .insert(responseData);

                if (respError) throw respError;

                // 2. Save final score
                const scoreData: AuditScoresInsert = {
                    user_id: user.id,
                    overall_score: overallScore,
                    category_scores: categoryScores as any,
                    recommendations: ["Based on your answers, prioritize AI Readiness Assessment and Security guidelines."]
                };

                const { error: scoreError } = await supabase
                    .from('audit_scores')
                    .insert(scoreData);

                if (scoreError) throw scoreError;

                // 3. Update profile
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: user.id,
                    has_completed_audit: true,
                    last_audit_score: overallScore,
                    updated_at: new Date().toISOString()
                } as any);

                if (profileError) throw profileError;
            }

            router.push('/dashboard');
        } catch (err: any) {
            console.error("Error saving audit:", err);
            setError("Failed to save your results. Please try again.");
            setIsFinishing(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE]">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (isFinishing) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FE] text-slate-900">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center px-6"
                >
                    <div className="mb-10 relative">
                        <div className="absolute inset-0 animate-ping rounded-full bg-blue-600/10 blur-xl" />
                        <img src="/images/logo.png" alt="AUDCOMP Logo" className="h-16 w-auto relative z-10 animate-pulse" />
                    </div>
                    <h2 className="text-4xl font-black mb-4">Finalizing Your Roadmap...</h2>
                    <p className="max-w-md text-slate-500 mb-8 font-medium">
                        Our engine is processing your assessment to build a custom AI strategy for your scale.
                    </p>
                    <div className="w-64 h-3 bg-white rounded-full overflow-hidden shadow-inner border border-slate-100">
                        <motion.div
                            className="h-full bg-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2 }}
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800 selection:bg-blue-600/10">
            {/* Header */}
            <header className="fixed top-0 z-50 flex w-full items-center justify-between px-10 py-6 bg-white shadow-sm">
                <div className="flex items-center gap-2">
                    <Link href="/">
                        <img
                            src="/images/AUDCOMP-LOGO.png"
                            alt="AUDCOMP Logo"
                            className="h-8 w-auto brightness-0"
                        />
                    </Link>
                    <span className="font-bold tracking-tight border-l border-slate-200 ml-2 pl-4 text-slate-400">Readiness Audit</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-400">Step {currentStep + 1} of {AUDIT_QUESTIONS.length}</span>
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </header>

            <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 pt-20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentQuestion.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full"
                    >
                        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-blue-600 border border-blue-100/50">
                            <Sparkles className="h-3 w-3" />
                            {currentQuestion.category}
                        </div>

                        <h1 className="mb-10 text-4xl font-black sm:text-6xl leading-[1.1] text-slate-900 tracking-tight">
                            {currentQuestion.text}
                        </h1>

                        <div className="grid gap-4 mt-8">
                            {currentQuestion.options.map((option, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(option.value)}
                                    className={`group relative flex w-full items-center justify-between rounded-[32px] border p-8 text-left transition-all hover:scale-[1.01] ${answers[currentQuestion.id] === option.value
                                        ? 'border-blue-600 bg-white shadow-xl shadow-blue-900/5 ring-1 ring-blue-600/5'
                                        : 'border-slate-100 bg-white/50 hover:border-slate-200 hover:bg-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${answers[currentQuestion.id] === option.value
                                            ? 'border-blue-600 bg-blue-600'
                                            : 'border-slate-200 bg-transparent'
                                            }`}>
                                            {answers[currentQuestion.id] === option.value && (
                                                <CheckCircle2 className="h-5 w-5 text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-xl font-bold text-slate-800">{option.label}</span>
                                            {option.feedback && answers[currentQuestion.id] === option.value && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    className="mt-3 flex items-start gap-2 text-sm text-blue-600 font-bold bg-blue-50/50 p-3 rounded-2xl border border-blue-100/20"
                                                >
                                                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                                                    <span>{option.feedback}</span>
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {error && (
                    <div className="mt-8 flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-600 border border-red-100">
                        <Info className="h-4 w-4" />
                        {error}
                    </div>
                )}

                {/* Navigation */}
                <div className="mt-16 flex w-full items-center justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-800 disabled:opacity-0 transition-colors"
                    >
                        <ChevronLeft className="h-6 w-6" />
                        Go Back
                    </button>

                    <button
                        onClick={nextStep}
                        disabled={answers[currentQuestion.id] === undefined}
                        className={`group flex items-center justify-center gap-3 rounded-[24px] bg-blue-600 px-10 py-5 text-lg font-black text-white transition-all hover:scale-105 shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:grayscale`}
                    >
                        {currentStep === AUDIT_QUESTIONS.length - 1 ? 'Analyze Now' : 'Continue'}
                        <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </main>
        </div>
    );
}
