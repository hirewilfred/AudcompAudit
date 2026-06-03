'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AUDIT_QUESTIONS } from '@/lib/audit-questions';
import { ChevronRight, ChevronLeft, CheckCircle2, Loader2, Info, User, ChevronDown } from 'lucide-react';
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
    const [experts, setExperts] = useState<any[]>([]);
    const [selectedExpertId, setSelectedExpertId] = useState('');
    const [fetchingExperts, setFetchingExperts] = useState(false);
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

        async function fetchExperts() {
            setFetchingExperts(true);
            try {
                const { data, error } = await supabase
                    .from('experts')
                    .select('id, full_name')
                    .order('full_name');
                if (!error && data) {
                    setExperts(data);
                }
            } catch (err) {
                console.error("Error fetching experts:", err);
            } finally {
                setFetchingExperts(false);
            }
        }
        fetchExperts();
    }, []);

    // Scroll to top when question changes or state changes
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentStep, isFinishing, isCheckingAuth]);

    const currentQuestion = AUDIT_QUESTIONS[currentStep];
    const totalSteps = AUDIT_QUESTIONS.length + 1; // +1 for Expert Selection
    const progress = ((currentStep + 1) / totalSteps) * 100;
    const isExpertStep = currentStep === AUDIT_QUESTIONS.length;

    const handleSelect = (value: number) => {
        setAnswers({ ...answers, [currentQuestion.id]: value });
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
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

                const { error: respError } = await (supabase
                    .from('audit_responses') as any)
                    .insert(responseData);

                if (respError) throw respError;

                // 2. Save final score
                const scoreData: AuditScoresInsert = {
                    user_id: user.id,
                    overall_score: overallScore,
                    category_scores: categoryScores as any,
                    recommendations: ["Based on your answers, prioritize AI Readiness Assessment and Security guidelines."]
                };

                const { error: scoreError } = await (supabase
                    .from('audit_scores') as any)
                    .insert(scoreData);

                if (scoreError) throw scoreError;

                // 3. Update profile
                let finalExpertId = selectedExpertId;
                if (selectedExpertId === 'not-sure' && experts.length > 0) {
                    const randomIndex = Math.floor(Math.random() * experts.length);
                    finalExpertId = experts[randomIndex].id;
                }

                const { error: profileError } = await (supabase.from('profiles') as any).upsert({
                    id: user.id,
                    has_completed_audit: true,
                    last_audit_score: overallScore,
                    assigned_expert_id: finalExpertId || null,
                    updated_at: new Date().toISOString()
                });

                if (profileError) throw profileError;

                // ── Funnel: register the completed audit as a landing-page
                // submission so it flows into the per-expert outreach pipeline.
                try {
                    const { data: profileRow } = await (supabase
                        .from('profiles') as any)
                        .select('full_name, email, organization, phone')
                        .eq('id', user.id)
                        .maybeSingle();

                    const params = new URLSearchParams(window.location.search);
                    await fetch('/api/landing/submit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            landing_page_slug: 'free-ai-audit',
                            email: profileRow?.email ?? user.email ?? '',
                            full_name: profileRow?.full_name ?? null,
                            organization: profileRow?.organization ?? null,
                            phone: profileRow?.phone ?? null,
                            audit_user_id: user.id,
                            referrer: typeof document !== 'undefined' ? document.referrer || null : null,
                            utm_source: params.get('utm_source'),
                            utm_medium: params.get('utm_medium'),
                            utm_campaign: params.get('utm_campaign'),
                            utm_term: params.get('utm_term'),
                            utm_content: params.get('utm_content'),
                        }),
                    });
                } catch (funnelErr) {
                    // Non-blocking — funnel failure shouldn't break the audit save.
                    console.warn('Funnel registration failed', funnelErr);
                }
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
            <div className="flex min-h-screen items-center justify-center bg-[#fbfbfd]">
                <Loader2 className="h-6 w-6 text-[#1d1d1f]/40 animate-spin" />
            </div>
        );
    }

    if (isFinishing) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfbfd] text-[#1d1d1f]">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center text-center px-6"
                >
                    <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP Logo" className="h-8 w-auto mb-10 opacity-80" />
                    <h2 className="display display-tight text-[40px] sm:text-[52px] mb-4">Finalizing your roadmap.</h2>
                    <p className="max-w-md text-[17px] text-[#6e6e73] mb-10 leading-[1.45]">
                        Our engine is processing your assessment to build a custom AI strategy for your scale.
                    </p>
                    <div className="w-64 h-1 bg-[#1d1d1f]/8 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#1d1d1f]"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 2, ease: 'easeOut' }}
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fbfbfd] text-[#1d1d1f]">
            <header className="sticky top-0 z-50 border-b hairline bg-white/72 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/60">
                <div className="mx-auto flex h-12 max-w-[1024px] items-center justify-between px-6">
                    <div className="flex items-center gap-3">
                        <Link href="/">
                            <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP Logo" className="h-5 w-auto opacity-90" />
                        </Link>
                        <span className="text-[12px] text-[#6e6e73] border-l hairline pl-3">Readiness Audit</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] text-[#6e6e73]">Step {currentStep + 1} of {totalSteps}</span>
                        <div className="w-24 h-1 bg-[#1d1d1f]/8 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#1d1d1f]"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            />
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-start px-6 pt-20 sm:pt-28 pb-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isExpertStep ? 'expert-step' : currentQuestion.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        <div className="eyebrow mb-4">
                            {isExpertStep ? "Expert assignment" : currentQuestion.category}
                        </div>

                        <h1 className="mb-12 display display-tight text-[#1d1d1f] text-[32px] sm:text-[48px] lg:text-[56px] [text-wrap:balance]">
                            {isExpertStep ? "Are you working with a sales rep or an AI expert?" : currentQuestion.text}
                        </h1>

                        <div className="grid gap-3">
                            {isExpertStep ? (
                                <div className="p-8 rounded-[24px] bg-white border hairline">
                                    <label className="eyebrow mb-3 block">Select your assigned expert</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" strokeWidth={1.5} />
                                        <select
                                            required
                                            value={selectedExpertId}
                                            onChange={(e) => setSelectedExpertId(e.target.value)}
                                            className="w-full rounded-[14px] border hairline bg-white py-4 pl-11 pr-10 text-[15px] text-[#1d1d1f] outline-none transition-all focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5 appearance-none cursor-pointer"
                                        >
                                            {fetchingExperts ? (
                                                <option>Loading experts…</option>
                                            ) : experts.length === 0 ? (
                                                <option value="">No experts found in system</option>
                                            ) : (
                                                <>
                                                    <option value="" disabled>Who are you dealing with?</option>
                                                    <option value="not-sure">I&apos;m not sure / not working with anyone yet</option>
                                                    {experts.map((expert) => (
                                                        <option key={expert.id} value={expert.id}>
                                                            {expert.full_name}
                                                        </option>
                                                    ))}
                                                </>
                                            )}
                                        </select>
                                        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#86868b]">
                                            {fetchingExperts ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4" strokeWidth={1.5} />
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-5 text-[13px] text-[#6e6e73] leading-[1.5]">
                                        This links your roadmap to your advisor so they can review your results before your session.
                                    </p>
                                </div>
                            ) : (
                                currentQuestion.options.map((option, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(option.value)}
                                        className={`group relative flex w-full items-center rounded-[18px] border p-6 text-left transition-all duration-200 ${answers[currentQuestion.id] === option.value
                                            ? 'border-[#1d1d1f] bg-white'
                                            : 'border-transparent bg-white hover:border-[#1d1d1f]/15'
                                            }`}
                                        style={{ borderColor: answers[currentQuestion.id] === option.value ? '#1d1d1f' : undefined }}
                                    >
                                        <div className="flex items-start gap-4 w-full">
                                            <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors mt-1 ${answers[currentQuestion.id] === option.value
                                                ? 'border-[#1d1d1f] bg-[#1d1d1f]'
                                                : 'border-[#1d1d1f]/20 bg-transparent'
                                                }`}>
                                                {answers[currentQuestion.id] === option.value && (
                                                    <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2} />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-[17px] font-medium text-[#1d1d1f] tracking-tight">{option.label}</span>
                                                {option.feedback && answers[currentQuestion.id] === option.value && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                        className="mt-3 flex items-start gap-2 text-[13px] text-[#6e6e73] bg-[#f5f5f7] p-3 rounded-[12px]"
                                                    >
                                                        <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" strokeWidth={1.5} />
                                                        <span>{option.feedback}</span>
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {error && (
                    <div className="mt-8 w-full flex items-center gap-2 rounded-[12px] bg-red-50 border border-red-100 p-4 text-[13px] text-red-700">
                        <Info className="h-3.5 w-3.5" />
                        {error}
                    </div>
                )}

                <div className="mt-16 flex w-full items-center justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="apple-pill apple-pill-ghost disabled:opacity-0"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                        Back
                    </button>

                    <button
                        onClick={nextStep}
                        disabled={!isExpertStep ? answers[currentQuestion.id] === undefined : selectedExpertId === ''}
                        className="apple-pill apple-pill-primary disabled:opacity-40"
                    >
                        {currentStep === totalSteps - 1 ? 'Analyze' : 'Continue'}
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </main>
        </div>
    );
}
