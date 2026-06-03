'use client';

import { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
    // useSearchParams must sit inside a Suspense boundary when this page is
    // statically prerendered.
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#fbfbfd]"><Loader2 className="h-6 w-6 text-[#1d1d1f]/40 animate-spin" /></div>}>
            <AuthPageContent />
        </Suspense>
    );
}

function AuthPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const nextParam = searchParams?.get('next') ?? null;
    const modeParam = searchParams?.get('mode') ?? null;
    const [isLogin, setIsLogin] = useState(modeParam !== 'signup');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createClient();

    // Only allow same-origin paths in `next` to prevent open-redirect.
    const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
                if (authError) throw authError;

                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    // Check if this email belongs to an Audcomp expert — they get the expert dashboard.
                    const { data: expertRow } = await supabase
                        .from('experts')
                        .select('id, email')
                        .eq('email', user.email ?? '')
                        .maybeSingle() as any;

                    if (expertRow?.id) {
                        router.push(safeNext ?? '/expert');
                        return;
                    }

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('has_completed_audit, is_admin')
                        .eq('id', user.id)
                        .single() as any;

                    if (profile?.is_admin) {
                        router.push(safeNext ?? '/admin');
                        return;
                    }

                    router.push(safeNext ?? (profile?.has_completed_audit ? '/dashboard' : '/survey'));
                }
            } else {
                const { data: signUpData, error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName, organization: companyName } }
                });
                if (authError) throw authError;

                if (signUpData.user) {
                    await (supabase.from('profiles') as any).upsert({
                        id: signUpData.user.id,
                        full_name: fullName,
                        email,
                        organization: companyName,
                        phone,
                        updated_at: new Date().toISOString()
                    });
                }

                router.push(safeNext ?? '/survey');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#fbfbfd]">

            {/* Left panel — photo + testimonial */}
            <div className="relative hidden w-[42%] shrink-0 lg:flex flex-col overflow-hidden">
                <img
                    src="/images/office-team.png"
                    alt="Audcomp Team"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/15" />

                <div className="relative z-10 p-10">
                    <Link href="/">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-6 w-auto" />
                    </Link>
                </div>

                <div className="relative z-10 mt-auto p-10 pb-12">
                    <blockquote className="mb-6 display display-tight text-[26px] sm:text-[30px] text-white">
                        &ldquo;The AI audit identified savings we didn&apos;t know existed — in under 10 minutes.&rdquo;
                    </blockquote>
                    <div>
                        <div className="text-[14px] font-semibold text-white">Sarah Mitchell</div>
                        <div className="text-[12px] text-white/60">Operations Manager, Clearview Accounting</div>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div className="flex flex-1 items-center justify-center px-6 py-16 bg-[#fbfbfd]">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full max-w-[400px]"
                >
                    <div className="mb-10">
                        <h1 className="display display-tight text-[36px] sm:text-[44px] text-[#1d1d1f]">
                            {isLogin ? 'Welcome back.' : 'Create your account.'}
                        </h1>
                        <p className="mt-3 text-[15px] text-[#6e6e73] leading-[1.5]">
                            {isLogin
                                ? 'Sign in to access your AI audit results and roadmap.'
                                : 'Join 500+ Canadian businesses already using AI to save money.'}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 flex items-center gap-2 rounded-[12px] bg-red-50 border border-red-100 px-4 py-3 text-[13px] text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">

                        {!isLogin && (
                            <>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Full name"
                                    className="w-full rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5"
                                />
                                <input
                                    type="text"
                                    required
                                    value={companyName}
                                    onChange={e => setCompanyName(e.target.value)}
                                    placeholder="Company"
                                    className="w-full rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5"
                                />
                                <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Phone"
                                    className="w-full rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5"
                                />
                            </>
                        )}

                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5"
                        />

                        <input
                            type="password"
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="Password"
                            className="w-full rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5"
                        />

                        {isLogin && (
                            <div className="flex items-center justify-between pt-1">
                                <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-[#6e6e73]">
                                    <button
                                        type="button"
                                        onClick={() => setRemember(!remember)}
                                        className={`relative h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none ${remember ? 'bg-[#1d1d1f]' : 'bg-[#1d1d1f]/15'}`}
                                    >
                                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${remember ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </button>
                                    Remember me
                                </label>
                                <button type="button" className="text-[13px] text-[#1d1d1f]/70 hover:text-[#1d1d1f] transition-colors">
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-3 w-full apple-pill apple-pill-primary justify-center py-3.5 disabled:opacity-50"
                        >
                            {loading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : isLogin ? 'Sign in' : 'Create account'}
                        </button>
                    </form>

                    <div className="my-6 flex items-center gap-3">
                        <div className="h-px flex-1 bg-[#1d1d1f]/8" />
                        <span className="text-[11px] text-[#86868b]">or</span>
                        <div className="h-px flex-1 bg-[#1d1d1f]/8" />
                    </div>

                    <button
                        type="button"
                        className="flex w-full items-center justify-center gap-3 rounded-[12px] border hairline bg-white px-4 py-3 text-[14px] font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7]"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>

                    <p className="mt-8 text-center text-[13px] text-[#6e6e73]">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="font-medium text-[#1d1d1f] hover:underline transition-colors"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>

                    <p className="mt-3 text-center text-[12px] text-[#86868b]">
                        Audcomp staff?{' '}
                        <Link href="/staff" className="text-[#1d1d1f] hover:underline transition-colors">
                            Internal portal →
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
