'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [phone, setPhone] = useState('');
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

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
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('has_completed_audit')
                        .eq('id', user.id)
                        .single() as any;

                    router.push(profile?.has_completed_audit ? '/dashboard' : '/survey');
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

                router.push('/survey');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred during authentication.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-white">

            {/* ── LEFT PANEL — photo + testimonial ── */}
            <div className="relative hidden w-[38%] shrink-0 lg:flex flex-col overflow-hidden">
                {/* Background image */}
                <img
                    src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&h=1200&fit=crop&q=85"
                    alt="Professional"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950/90 via-gray-900/40 to-gray-900/30" />

                {/* Logo */}
                <div className="relative z-10 p-8">
                    <Link href="/">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-9 w-auto" />
                    </Link>
                </div>

                {/* Testimonial at bottom */}
                <div className="relative z-10 mt-auto p-8 pb-10">
                    <blockquote className="mb-5 text-[22px] font-bold leading-snug text-white">
                        "The AI audit identified savings we didn't know existed — in under 10 minutes."
                    </blockquote>
                    <div>
                        <div className="text-[14px] font-semibold text-white">Sarah Mitchell</div>
                        <div className="text-[12px] text-gray-400">Operations Manager, Clearview Accounting</div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT PANEL — form ── */}
            <div className="flex flex-1 items-center justify-center px-6 py-12 bg-white">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full max-w-[400px]"
                >
                    {/* Heading */}
                    <div className="mb-8">
                        <h1 className="text-[28px] font-bold tracking-tight text-gray-900">
                            {isLogin ? 'Welcome back to AUDCOMP' : 'Create your account'}
                        </h1>
                        <p className="mt-2 text-[14px] text-gray-500">
                            {isLogin
                                ? 'Sign in to access your AI audit results and roadmap.'
                                : 'Join 500+ Canadian businesses already using AI to save money.'}
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-5 flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-[13px] font-medium text-red-600">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">

                        {/* Sign-up only fields */}
                        {!isLogin && (
                            <>
                                <div>
                                    <label className="mb-1.5 block text-[12px] font-medium text-gray-500">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[12px] font-medium text-gray-500">Company Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={companyName}
                                        onChange={e => setCompanyName(e.target.value)}
                                        placeholder="Acme Corp"
                                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-[12px] font-medium text-gray-500">Phone Number</label>
                                    <input
                                        type="tel"
                                        required
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                                    />
                                </div>
                            </>
                        )}

                        {/* Email */}
                        <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-gray-500">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="mb-1.5 block text-[12px] font-medium text-gray-500">Password</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••••"
                                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-[14px] text-gray-900 placeholder-gray-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                            />
                        </div>

                        {/* Forgot + Remember row (login only) */}
                        {isLogin && (
                            <div className="flex items-center justify-between pt-0.5">
                                <label className="flex cursor-pointer items-center gap-2.5 text-[13px] text-gray-500">
                                    {/* Toggle switch */}
                                    <button
                                        type="button"
                                        onClick={() => setRemember(!remember)}
                                        className={`relative h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none ${remember ? 'bg-orange-500' : 'bg-gray-200'}`}
                                    >
                                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${remember ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </button>
                                    Remember sign in details
                                </label>
                                <button type="button" className="text-[13px] font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                                    Forgot password?
                                </button>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: '#F97316' }}
                        >
                            {loading
                                ? <Loader2 className="h-5 w-5 animate-spin" />
                                : isLogin ? 'Log in' : 'Create Account'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-5 flex items-center gap-3">
                        <div className="h-px flex-1 bg-gray-200" />
                        <span className="text-[12px] font-medium text-gray-400">OR</span>
                        <div className="h-px flex-1 bg-gray-200" />
                    </div>

                    {/* Google */}
                    <button
                        type="button"
                        className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-100"
                    >
                        {/* Google "G" icon */}
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Continue with Google
                    </button>

                    {/* Toggle login/signup */}
                    <p className="mt-6 text-center text-[13px] text-gray-400">
                        {isLogin ? "Don't have an account? " : 'Already have an account? '}
                        <button
                            onClick={() => { setIsLogin(!isLogin); setError(null); }}
                            className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
