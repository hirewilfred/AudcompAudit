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
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE]">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (isSubmitting) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-[#F4F7FE] text-slate-900">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center px-6"
                >
                    <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/10">
                        <BrainCircuit className="h-10 w-10 text-blue-600 animate-pulse" />
                    </div>
                    <h2 className="text-3xl font-black mb-3">Building Your Roadmap...</h2>
                    <p className="text-slate-500 mb-8 font-medium max-w-sm">
                        Analyzing your environment and matching you with the best AI solutions.
                    </p>
                    <div className="w-64 h-3 bg-white rounded-full overflow-hidden shadow-inner border border-slate-100">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5 }}
                        />
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            {/* Header */}
            <header className="fixed top-0 z-50 flex w-full items-center justify-between px-8 py-5 bg-white shadow-sm">
                <div className="flex items-center gap-3">
                    <Link href="/">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-8 w-auto brightness-0" />
                    </Link>
                    <span className="font-bold tracking-tight border-l border-slate-200 ml-2 pl-4 text-slate-400">
                        AI Adoption Advisor
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-slate-400">
                        Step {currentStep + 1} of {totalSteps}
                    </span>
                    <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                </div>
            </header>

            <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-start px-6 pt-32 pb-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full"
                    >
                        {/* Step badge */}
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-blue-600 border border-blue-100/50">
                            <BrainCircuit className="h-3 w-3" />
                            Step {currentStep + 1} — {step.id.replace(/_/g, ' ')}
                        </div>

                        <h1 className="mb-3 text-4xl font-black sm:text-5xl leading-tight text-slate-900 tracking-tight">
                            {step.title}
                        </h1>
                        <p className="mb-10 text-lg text-slate-500 font-medium">{step.subtitle}</p>

                        <div className="space-y-8">
                            {step.fields.map(field => (
                                <div key={field.id}>
                                    {step.fields.length > 1 && (
                                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
                                            {field.label}
                                        </label>
                                    )}

                                    {/* Radio cards */}
                                    {field.type === 'radio' && (
                                        <>
                                        {/* M365 auto-detect banner — shown only for the m365_tier field */}
                                        {field.id === 'm365_tier' && (
                                            <div className="mb-5">
                                                {m365Connected ? (
                                                    <div className="flex items-center gap-3 rounded-[18px] border border-green-200 bg-green-50 px-5 py-4">
                                                        <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
                                                        <div>
                                                            <p className="text-sm font-black text-green-800">Microsoft 365 Connected</p>
                                                            <p className="text-xs text-green-600 mt-0.5">
                                                                Detected: {TIER_LABELS[responses['m365_tier'] as string] ?? responses['m365_tier']}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={handleConnectM365}
                                                            className="ml-auto text-xs font-bold text-green-600 hover:text-green-800 transition-colors"
                                                        >
                                                            Re-detect
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={handleConnectM365}
                                                        disabled={isConnectingM365}
                                                        className="flex w-full items-center justify-center gap-3 rounded-[18px] border border-blue-200 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700 transition-all hover:bg-blue-100 disabled:opacity-60 disabled:pointer-events-none"
                                                    >
                                                        {isConnectingM365 ? (
                                                            <>
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                                Connecting…
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Link2 className="h-4 w-4" />
                                                                Auto-detect via Microsoft 365
                                                                <span className="ml-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-500">Recommended</span>
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
                                                    className={`group flex w-full items-center justify-between rounded-[24px] border p-6 text-left transition-all hover:scale-[1.01] ${responses[field.id] === opt.value
                                                        ? 'border-blue-600 bg-white shadow-xl shadow-blue-900/5 ring-1 ring-blue-600/5'
                                                        : 'border-slate-100 bg-white/70 hover:border-slate-200 hover:bg-white'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-5">
                                                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${responses[field.id] === opt.value
                                                            ? 'border-blue-600 bg-blue-600'
                                                            : 'border-slate-200 bg-transparent'
                                                            }`}>
                                                            {responses[field.id] === opt.value && (
                                                                <CheckCircle2 className="h-4 w-4 text-white" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="text-base font-bold text-slate-800">{opt.label}</span>
                                                            {opt.description && (
                                                                <p className="text-sm text-slate-400 mt-0.5">{opt.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                        </>
                                    )}

                                    {/* Select dropdown */}
                                    {field.type === 'select' && (
                                        <div className="relative">
                                            <select
                                                value={(responses[field.id] as string) || ''}
                                                onChange={e => handleSelectChange(field.id, e.target.value)}
                                                className="w-full rounded-[20px] border border-slate-200 bg-white py-5 pl-6 pr-12 text-base text-slate-900 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 font-semibold appearance-none cursor-pointer shadow-sm"
                                            >
                                                <option value="" disabled>Select an option...</option>
                                                {field.options.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                                        </div>
                                    )}

                                    {/* Multi-select cards */}
                                    {field.type === 'multiselect' && (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            {field.options.map(opt => {
                                                const selected = ((responses[field.id] as string[]) || []).includes(opt.value);
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        onClick={() => handleMultiSelect(field.id, opt.value)}
                                                        className={`group flex w-full items-start gap-4 rounded-[20px] border p-5 text-left transition-all hover:scale-[1.01] ${selected
                                                            ? 'border-blue-600 bg-white shadow-lg shadow-blue-900/5 ring-1 ring-blue-600/5'
                                                            : 'border-slate-100 bg-white/70 hover:border-slate-200 hover:bg-white'
                                                            }`}
                                                    >
                                                        <div className={`flex h-6 w-6 shrink-0 mt-0.5 items-center justify-center rounded-md border-2 transition-colors ${selected
                                                            ? 'border-blue-600 bg-blue-600'
                                                            : 'border-slate-200 bg-transparent'
                                                            }`}>
                                                            {selected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-bold text-slate-800">{opt.label}</span>
                                                            {opt.description && (
                                                                <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
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

                {/* Navigation */}
                <div className="mt-12 flex w-full items-center justify-between">
                    <button
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 text-slate-400 font-bold hover:text-slate-800 disabled:opacity-0 transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                        Back
                    </button>

                    <button
                        onClick={nextStep}
                        disabled={!isStepComplete()}
                        className="group flex items-center justify-center gap-3 rounded-[20px] bg-blue-600 px-8 py-4 text-base font-black text-white transition-all hover:scale-105 shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:pointer-events-none"
                    >
                        {currentStep === totalSteps - 1 ? 'Generate My Roadmap' : 'Continue'}
                        <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </main>
        </div>
    );
}
