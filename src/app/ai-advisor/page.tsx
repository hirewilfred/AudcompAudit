'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ADVISOR_STEPS, AdvisorResponses } from '@/lib/advisor-questions';
import { ChevronRight, ChevronLeft, BrainCircuit, Loader2, CheckCircle2, ChevronDown, Link2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { preInitMsal, loginForAdvisorSync } from '@/lib/msal';

// Maps Microsoft 365 SKU part numbers → advisor tier values.
// Priority (highest wins): e5 > e3 > premium > standard > basic
const SKU_TO_TIER: Record<string, string> = {
    SPE_E5: 'e5', ENTERPRISEPREMIUM: 'e5', SPE_E5_USGOV_GCCHIGH: 'e5',
    SPE_E3: 'e3', ENTERPRISEPACK: 'e3', SPE_E3_USGOV_GCCHIGH: 'e3',
    SPB: 'premium', O365_BUSINESS_PREMIUM: 'premium',
    O365_BUSINESS: 'standard', STANDARDWOFFPACK_IW: 'standard',
    O365_BUSINESS_ESSENTIALS: 'basic', O365_BUSINESSESSENTIALS: 'basic',
    SMB_BUSINESS_ESSENTIALS: 'basic', STANDARDPACK: 'basic',
    DESKLESSPACK: 'basic', M365_F1: 'basic',
};
const TIER_PRIORITY = ['e5', 'e3', 'premium', 'standard', 'basic'];

async function detectM365Tier(accessToken: string): Promise<string> {
    const res = await fetch('https://graph.microsoft.com/v1.0/me/licenseDetails', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return 'unsure';
    const data = await res.json();
    const skus: string[] = (data.value || []).map((s: { skuPartNumber: string }) => s.skuPartNumber);
    for (const tier of TIER_PRIORITY) {
        if (skus.some(sku => SKU_TO_TIER[sku] === tier)) return tier;
    }
    return skus.length > 0 ? 'unsure' : 'none';
}

const TIER_LABELS: Record<string, string> = {
    e5: 'Microsoft 365 E5', e3: 'Microsoft 365 E3',
    premium: 'Microsoft 365 Business Premium', standard: 'Microsoft 365 Business Standard',
    basic: 'Microsoft 365 Business Basic', none: 'No Microsoft 365 license detected',
    unsure: 'Unrecognised plan — please select manually',
};

export default function AIAdvisorPage() {
    const [currentStep, setCurrentStep] = useState(0);
    const [responses, setResponses] = useState<AdvisorResponses>({});
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isConnectingM365, setIsConnectingM365] = useState(false);
    const [m365Connected, setM365Connected] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function checkAuth() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/auth');
            } else {
                setIsCheckingAuth(false);
                // Pre-initialise MSAL so the M365 connect popup is never blocked
                preInitMsal().catch(() => { /* non-critical */ });
            }
        }
        checkAuth();
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentStep]);

    const step = ADVISOR_STEPS[currentStep];
    const totalSteps = ADVISOR_STEPS.length;
    const progress = ((currentStep + 1) / totalSteps) * 100;

    const isStepComplete = () => {
        for (const field of step.fields) {
            const val = responses[field.id];
            if (field.type === 'multiselect') {
                if (!val || (val as string[]).length === 0) return false;
            } else {
                if (!val || val === '') return false;
            }
        }
        return true;
    };

    const handleSelect = (fieldId: string, value: string) => {
        setResponses(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleMultiSelect = (fieldId: string, value: string) => {
        setResponses(prev => {
            const current = (prev[fieldId] as string[]) || [];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [fieldId]: updated };
        });
    };

    const handleSelectChange = (fieldId: string, value: string) => {
        setResponses(prev => ({ ...prev, [fieldId]: value }));
    };

    // Called synchronously from a click handler to avoid popup blocking
    const handleConnectM365 = () => {
        setIsConnectingM365(true);
        loginForAdvisorSync()
            .then(async ({ accessToken }) => {
                const tier = await detectM365Tier(accessToken);
                setM365Connected(true);
                setResponses(prev => ({ ...prev, m365_tier: tier }));
            })
            .catch(() => { /* user cancelled or popup blocked — leave manual selection */ })
            .finally(() => setIsConnectingM365(false));
    };

    const nextStep = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleSubmit();
        }
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(currentStep - 1);
    };

    const handleSubmit = () => {
        setIsSubmitting(true);
        sessionStorage.setItem('advisor_responses', JSON.stringify(responses));
        router.push('/ai-advisor/results');
    };

    if (isCheckingAuth) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#fbfbfd]">
                <Loader2 className="h-6 w-6 text-[#1d1d1f]/40 animate-spin" />
            </div>
        );
    }

    if (isSubmitting) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#fbfbfd] text-[#1d1d1f]">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col items-center text-center px-6"
                >
                    <BrainCircuit className="h-10 w-10 text-[#1d1d1f]/40 mb-8 animate-pulse" strokeWidth={1.2} />
                    <h2 className="display display-tight text-[36px] sm:text-[48px] mb-3">Building your roadmap.</h2>
                    <p className="text-[17px] text-[#6e6e73] mb-10 max-w-sm leading-[1.45]">
                        Analyzing your environment and matching you with the best AI solutions.
                    </p>
                    <div className="w-64 h-1 bg-[#1d1d1f]/8 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[#1d1d1f]"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
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
                            <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-5 w-auto opacity-90" />
                        </Link>
                        <span className="text-[12px] text-[#6e6e73] border-l hairline pl-3">AI Adoption Advisor</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[12px] text-[#6e6e73]">Step {currentStep + 1} of {totalSteps}</span>
                        <div className="w-24 h-1 bg-[#1d1d1f]/8 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-[#1d1d1f]"
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
                        key={step.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="w-full"
                    >
                        <div className="eyebrow mb-4">
                            Step {currentStep + 1} — {step.id.replace(/_/g, ' ')}
                        </div>

                        <h1 className="mb-3 display display-tight text-[32px] sm:text-[48px] lg:text-[56px] text-[#1d1d1f] [text-wrap:balance]">
                            {step.title}
                        </h1>
                        <p className="mb-12 text-[19px] text-[#6e6e73] leading-[1.45]">{step.subtitle}</p>

                        <div className="space-y-8">
                            {step.fields.map(field => (
                                <div key={field.id}>
                                    {step.fields.length > 1 && (
                                        <label className="eyebrow block mb-4">{field.label}</label>
                                    )}

                                    {field.type === 'radio' && (
                                        <>
                                        {field.id === 'm365_tier' && (
                                            <div className="mb-4">
                                                {m365Connected ? (
                                                    <div className="flex items-center gap-3 rounded-[14px] bg-[#1d1d1f]/[0.04] px-5 py-4">
                                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#1d1d1f]" strokeWidth={1.5} />
                                                        <div>
                                                            <p className="text-[14px] font-medium text-[#1d1d1f]">Microsoft 365 connected</p>
                                                            <p className="text-[12px] text-[#6e6e73] mt-0.5">
                                                                Detected: {TIER_LABELS[responses['m365_tier'] as string] ?? responses['m365_tier']}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={handleConnectM365}
                                                            className="ml-auto text-[12px] text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
                                                        >
                                                            Re-detect
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={handleConnectM365}
                                                        disabled={isConnectingM365}
                                                        className="flex w-full items-center justify-center gap-3 rounded-[14px] border hairline bg-white px-5 py-4 text-[14px] font-medium text-[#1d1d1f] transition-colors hover:bg-[#f5f5f7] disabled:opacity-60 disabled:pointer-events-none"
                                                    >
                                                        {isConnectingM365 ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Connecting…
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Link2 className="h-4 w-4" strokeWidth={1.5} />
                                                                Auto-detect via Microsoft 365
                                                                <span className="ml-1 rounded-full bg-[#1d1d1f]/[0.06] px-2 py-0.5 text-[11px] text-[#6e6e73]">Recommended</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <div className="grid gap-3">
                                            {field.options.map(opt => (
                                                <button
                                                    key={opt.value}
                                                    onClick={() => handleSelect(field.id, opt.value)}
                                                    className={`group flex w-full items-center rounded-[18px] border p-6 text-left transition-all duration-200 ${responses[field.id] === opt.value
                                                        ? 'border-[#1d1d1f] bg-white'
                                                        : 'border-transparent bg-white hover:border-[#1d1d1f]/15'
                                                        }`}
                                                >
                                                    <div className="flex items-start gap-4 w-full">
                                                        <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors mt-1 ${responses[field.id] === opt.value
                                                            ? 'border-[#1d1d1f] bg-[#1d1d1f]'
                                                            : 'border-[#1d1d1f]/20 bg-transparent'
                                                            }`}>
                                                            {responses[field.id] === opt.value && (
                                                                <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="text-[16px] font-medium text-[#1d1d1f] tracking-tight">{opt.label}</span>
                                                            {opt.description && (
                                                                <p className="text-[13px] text-[#6e6e73] mt-1 leading-[1.5]">{opt.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        </>
                                    )}

                                    {field.type === 'select' && (
                                        <div className="relative">
                                            <select
                                                value={(responses[field.id] as string) || ''}
                                                onChange={e => handleSelectChange(field.id, e.target.value)}
                                                className="w-full rounded-[14px] border hairline bg-white py-4 pl-5 pr-12 text-[15px] text-[#1d1d1f] outline-none transition-all focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5 appearance-none cursor-pointer"
                                            >
                                                <option value="" disabled>Select an option…</option>
                                                {field.options.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" strokeWidth={1.5} />
                                        </div>
                                    )}

                                    {field.type === 'multiselect' && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {field.options.map(opt => {
                                                const selected = ((responses[field.id] as string[]) || []).includes(opt.value);
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => handleMultiSelect(field.id, opt.value)}
                                                        className={`group flex w-full items-start gap-4 rounded-[16px] border p-5 text-left transition-all duration-200 ${selected
                                                            ? 'border-[#1d1d1f] bg-white'
                                                            : 'border-transparent bg-white hover:border-[#1d1d1f]/15'
                                                            }`}
                                                    >
                                                        <div className={`flex h-5 w-5 shrink-0 mt-0.5 items-center justify-center rounded-md border transition-colors ${selected
                                                            ? 'border-[#1d1d1f] bg-[#1d1d1f]'
                                                            : 'border-[#1d1d1f]/20 bg-transparent'
                                                            }`}>
                                                            {selected && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={2} />}
                                                        </div>
                                                        <div>
                                                            <span className="text-[14px] font-medium text-[#1d1d1f] tracking-tight">{opt.label}</span>
                                                            {opt.description && (
                                                                <p className="text-[12px] text-[#6e6e73] mt-1 leading-[1.5]">{opt.description}</p>
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="mt-12 flex w-full items-center justify-between">
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
                        disabled={!isStepComplete()}
                        className="apple-pill apple-pill-primary disabled:opacity-40"
                    >
                        {currentStep === totalSteps - 1 ? 'Generate roadmap' : 'Continue'}
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </main>
        </div>
    );
}
