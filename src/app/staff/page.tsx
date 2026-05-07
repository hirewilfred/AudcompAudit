'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Loader2, AlertCircle, Lock, Shield, ShieldCheck, KeyRound, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function StaffAuthPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#050B1A]">
                <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
            </div>
        }>
            <Inner />
        </Suspense>
    );
}

function Inner() {
    const router = useRouter();
    const params = useSearchParams();
    const nextParam = params?.get('next') ?? null;
    const safeNext = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;

    const supabase = createClient();
    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // shared
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // signup only
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState<'admin' | 'expert' | 'staff' | 'sales'>('staff');
    const [inviteCode, setInviteCode] = useState('');

    const routeAfterAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, is_staff, staff_role, has_completed_audit')
            .eq('id', user.id)
            .single() as any;

        if (profile?.is_admin) { router.push(safeNext ?? '/admin'); return; }
        if (profile?.is_staff) {
            // experts get the expert dashboard, others go to a staff landing.
            if (profile.staff_role === 'expert') { router.push(safeNext ?? '/expert'); return; }
            router.push(safeNext ?? '/dashboard');
            return;
        }
        // Non-staff who somehow landed here — fall back to normal flow.
        router.push(safeNext ?? (profile?.has_completed_audit ? '/dashboard' : '/survey'));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
                if (authError) throw authError;
                await routeAfterAuth();
                return;
            }

            // signup — server validates invite code, creates user + profile
            const res = await fetch('/api/staff/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, full_name: fullName, phone, role, invite_code: inviteCode }),
            });
            const j = await res.json();
            if (!res.ok) throw new Error(j.error || `Signup failed (${res.status})`);

            // Sign the new user in automatically
            const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
            if (signInErr) throw signInErr;
            await routeAfterAuth();
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen bg-[#F4F7FE]">
            {/* LEFT — dark navy panel */}
            <div className="relative hidden lg:flex w-[42%] shrink-0 flex-col overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900" />
                <div
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.4) 1px, transparent 0)',
                        backgroundSize: '24px 24px',
                    }}
                />
                <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-blue-500/30 blur-[140px] pointer-events-none" />
                <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-indigo-500/20 blur-[140px] pointer-events-none" />

                <div className="relative z-10 p-10">
                    <Link href="/">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-9 w-auto" />
                    </Link>
                </div>

                <div className="relative z-10 mt-auto p-10 pb-12">
                    <div className="inline-flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-5 bg-white/5 border border-white/10 backdrop-blur px-3 py-1.5 rounded-full">
                        <Shield className="h-3 w-3" /> Internal access
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-white leading-[1.05] mb-4">
                        Audcomp <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">staff portal</span>
                    </h1>
                    <p className="text-blue-100/80 text-base leading-relaxed max-w-md mb-6">
                        Sign in to manage audits, AMS clients, outreach campaigns, and the agent fleet. New team members can register with an invite code.
                    </p>
                    <ul className="space-y-2 text-sm text-blue-100/80">
                        {[
                            'Skips the customer AI audit questionnaire',
                            'Auto-routes admins, experts, and sales to their dashboards',
                            'Email-confirmed instantly via service-role provisioning',
                        ].map(line => (
                            <li key={line} className="flex items-start gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-300 mt-0.5 shrink-0" />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* RIGHT — form */}
            <div className="flex flex-1 items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="w-full max-w-[440px]"
                >
                    <div className="lg:hidden mb-8 flex items-center justify-center">
                        <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-9 w-auto" />
                    </div>

                    <div className="mb-7">
                        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-700 mb-3">
                            <ShieldCheck className="h-3 w-3" /> Internal staff
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            {mode === 'login' ? 'Welcome back.' : 'Create your staff account.'}
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            {mode === 'login'
                                ? 'Sign in to the Audcomp internal portal.'
                                : 'You\'ll skip the AI audit questionnaire — straight into the right dashboard.'
                            }
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-medium text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-3">
                        {mode === 'signup' && (
                            <>
                                <Field label="Invite code" icon={KeyRound}>
                                    <input
                                        required
                                        value={inviteCode}
                                        onChange={e => setInviteCode(e.target.value)}
                                        placeholder="Provided by your admin"
                                        className="form-input"
                                    />
                                </Field>
                                <div className="grid grid-cols-2 gap-3">
                                    <Field label="Full name">
                                        <input
                                            required
                                            value={fullName}
                                            onChange={e => setFullName(e.target.value)}
                                            placeholder="Vince Greco"
                                            className="form-input"
                                        />
                                    </Field>
                                    <Field label="Role">
                                        <select
                                            value={role}
                                            onChange={e => setRole(e.target.value as any)}
                                            className="form-input cursor-pointer"
                                        >
                                            <option value="staff">Staff</option>
                                            <option value="expert">Expert</option>
                                            <option value="sales">Sales</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </Field>
                                </div>
                                <Field label="Phone (optional)">
                                    <input
                                        value={phone}
                                        onChange={e => setPhone(e.target.value)}
                                        placeholder="+1 (905) 555-0000"
                                        className="form-input"
                                    />
                                </Field>
                            </>
                        )}

                        <Field label="Work email">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="you@audcomp.com"
                                className="form-input"
                            />
                        </Field>

                        <Field label={mode === 'signup' ? 'Create a password (min 8 chars)' : 'Password'} icon={Lock}>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••••"
                                minLength={mode === 'signup' ? 8 : undefined}
                                className="form-input"
                            />
                        </Field>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-black uppercase tracking-widest text-xs px-6 py-4 rounded-xl shadow-lg shadow-blue-600/30 transition-all"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                                <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight className="h-3.5 w-3.5" /></>
                            }
                        </button>
                    </form>

                    <p className="mt-6 text-center text-sm text-slate-500">
                        {mode === 'login' ? "New team member? " : 'Already have access? '}
                        <button
                            onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}
                            className="font-black text-blue-700 hover:text-blue-800"
                        >
                            {mode === 'login' ? 'Create an account' : 'Sign in'}
                        </button>
                    </p>

                    <div className="mt-8 pt-6 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-500">
                            Customer? <Link href="/auth" className="font-bold text-blue-700 hover:text-blue-800">Use the customer login →</Link>
                        </p>
                    </div>
                </motion.div>
            </div>

            <style jsx global>{`
                .form-input {
                    width: 100%;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                    background: white;
                    padding: 0.75rem 1rem;
                    font-size: 0.875rem;
                    color: #0f172a;
                    outline: none;
                    transition: all 0.15s;
                }
                .form-input::placeholder { color: #94a3b8; }
                .form-input:focus { border-color: #93c5fd; box-shadow: 0 0 0 3px rgb(219 234 254 / 0.5); }
            `}</style>
        </div>
    );
}

function Field({ label, icon: Icon, children }: { label: string; icon?: any; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-1.5 inline-flex items-center gap-1.5">
                {Icon && <Icon className="h-3 w-3" />}
                {label}
            </span>
            {children}
        </label>
    );
}
