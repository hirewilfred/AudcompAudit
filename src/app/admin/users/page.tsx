'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import {
    Users, Search, Loader2, Shield, CheckCircle2,
    UserPlus, KeyRound, Mail, X, ChevronDown, BadgeCheck, Briefcase, ExternalLink,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Database } from '@/lib/database.types';

export default function UsersListPage() {
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<Database['public']['Tables']['profiles']['Row'][]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [resettingId, setResettingId] = useState<string | null>(null);
    const [inviteOpen, setInviteOpen] = useState<null | 'user' | 'admin' | 'expert'>(null);
    const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const showToast = (kind: 'ok' | 'err', text: string) => {
        setToast({ kind, text });
        window.setTimeout(() => setToast(null), 4500);
    };

    const sendPasswordReset = async (email: string | null, id: string) => {
        if (!email) { showToast('err', 'No email on file for this user.'); return; }
        if (!window.confirm(`Send a password-reset email to ${email}?`)) return;
        setResettingId(id);
        try {
            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Reset failed');
            showToast('ok', `Password-reset email sent to ${email}.`);
        } catch (err: any) {
            showToast('err', err.message || 'Reset failed.');
        } finally {
            setResettingId(null);
        }
    };

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setProfiles((data as any) || []);
        } catch (err) {
            console.error("Error fetching profiles:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfiles();
    }, []);



    const toggleAdminStatus = async (id: string, currentStatus: boolean) => {
        setUpdatingId(id);
        try {
            const res = await fetch('/api/admin/set-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, isAdmin: !currentStatus }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Failed to update.');
            setProfiles(prev => prev.map(p => p.id === id ? { ...p, is_admin: !currentStatus } : p));
        } catch (err: any) {
            console.error("Error updating Admin status:", err);
            alert(`Failed to update Admin status: ${err.message}`);
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredProfiles = profiles.filter(profile =>
        (profile.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (profile.organization?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />

            <main className="pl-64 pr-10 pt-10 pb-20">
                <header className="flex flex-wrap items-end justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">User Management</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Invite, promote, and recover access for every account</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setInviteOpen('user')}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-blue-600/20"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add Customer
                        </button>
                        <button
                            onClick={() => setInviteOpen('admin')}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest transition-colors"
                        >
                            <Shield className="h-4 w-4" />
                            Add Administrator
                        </button>
                        <button
                            onClick={() => setInviteOpen('expert')}
                            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest transition-colors"
                        >
                            <Briefcase className="h-4 w-4" />
                            Add Expert
                        </button>
                    </div>
                </header>

                {/* Search Bar */}
                <div className="relative mb-10 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name or organization..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 shadow-sm focus:shadow-xl focus:shadow-blue-900/5 placeholder:text-slate-300"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                    </div>
                ) : profiles.length === 0 ? (
                    <div className="bg-white rounded-[48px] p-20 text-center border border-slate-100 border-dashed">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                            <Users className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No users found</h3>
                        <p className="text-slate-400 font-bold mb-8">There are currently no registered users.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredProfiles.map((profile) => (
                                <motion.div
                                    key={profile.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="h-16 w-16 rounded-[24px] bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-sm">
                                            <div className="h-full w-full rounded-[22px] bg-white flex items-center justify-center overflow-hidden">
                                                <img src={`https://ui-avatars.com/api/?name=${profile.full_name || 'User'}&background=fff&color=3b82f6`} alt="Avatar" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {profile.is_admin && (
                                                <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-center">
                                                    Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 mb-1 leading-tight">{profile.full_name || 'Unknown User'}</h3>
                                    <p className="text-sm font-bold text-slate-400 mb-6">{profile.organization || 'No Organization'}</p>

                                    <div className="mt-auto pt-6 border-t border-slate-50 flex flex-col gap-4">
                                        {/* Admin Switch */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-slate-900">Admin Privileges</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">System Access</span>
                                            </div>
                                            <button
                                                onClick={() => toggleAdminStatus(profile.id, !!profile.is_admin)}
                                                disabled={updatingId === profile.id}
                                                className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${profile.is_admin ? 'bg-slate-900' : 'bg-slate-200'} disabled:opacity-50`}
                                            >
                                                <span className="sr-only">Toggle Admin status</span>
                                                <span
                                                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${profile.is_admin ? 'translate-x-5' : 'translate-x-0'}`}
                                                />
                                            </button>
                                        </div>

                                        {/* Recover password */}
                                        <button
                                            onClick={() => sendPasswordReset((profile as any).email, profile.id)}
                                            disabled={resettingId === profile.id || !(profile as any).email}
                                            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-amber-700 transition-colors disabled:opacity-50"
                                        >
                                            {resettingId === profile.id
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <KeyRound className="h-3.5 w-3.5" />}
                                            {resettingId === profile.id ? 'Sending…' : 'Recover Password'}
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>

            <AnimatePresence>
                {inviteOpen && (
                    <InviteModal
                        kind={inviteOpen}
                        onClose={() => setInviteOpen(null)}
                        onSuccess={(msg) => { showToast('ok', msg); setInviteOpen(null); fetchProfiles(); }}
                        onError={(msg) => showToast('err', msg)}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 16 }}
                        className={`fixed bottom-6 right-6 z-[200] rounded-2xl px-5 py-4 shadow-2xl border max-w-md ${
                            toast.kind === 'ok'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            {toast.kind === 'ok' ? <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" /> : <X className="h-5 w-5 text-rose-600 mt-0.5 shrink-0" />}
                            <p className="text-sm font-bold leading-snug">{toast.text}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function InviteModal({
    kind,
    onClose,
    onSuccess,
    onError,
}: {
    kind: 'user' | 'admin' | 'expert';
    onClose: () => void;
    onSuccess: (msg: string) => void;
    onError: (msg: string) => void;
}) {
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        email: '', full_name: '', organization: '', phone: '',
        linkedin_url: '', bookings_url: '', photo_url: '', is_bdm: false,
    });

    const config = {
        user:   { title: 'Add a Customer',         desc: 'Send an invite. They\'ll set their password and start at the AI readiness survey.', endpoint: '/api/admin/invite-user',   payload: () => ({ email: form.email, full_name: form.full_name, organization: form.organization, phone: form.phone, role: 'customer' }), accent: 'bg-blue-600 hover:bg-blue-500',  iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
        admin:  { title: 'Add an Administrator',   desc: 'Send an invite. They\'ll set a password and land in the admin command center.',     endpoint: '/api/admin/invite-user',   payload: () => ({ email: form.email, full_name: form.full_name, organization: form.organization, phone: form.phone, role: 'admin' }),    accent: 'bg-slate-900 hover:bg-slate-800', iconBg: 'bg-slate-100', iconColor: 'text-slate-900' },
        expert: { title: 'Add an Expert',          desc: 'Adds a row to the experts table. Tick "Send invite" to email them a portal login.', endpoint: '/api/admin/create-expert', payload: () => ({ full_name: form.full_name, email: form.email, linkedin_url: form.linkedin_url, bookings_url: form.bookings_url, photo_url: form.photo_url, is_bdm: form.is_bdm, sendInvite: true }), accent: 'bg-emerald-600 hover:bg-emerald-500', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    }[kind];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.full_name) { onError('Name and email are required.'); return; }
        setSubmitting(true);
        try {
            const res = await fetch(config.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config.payload()),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'Request failed');
            onSuccess(json.message || `${form.full_name} invited — they'll receive an email shortly.`);
        } catch (err: any) {
            onError(err.message || 'Request failed.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.96, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.96, opacity: 0, y: 20 }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl p-10"
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-6 right-6 h-9 w-9 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition">
                    <X className="h-4 w-4" />
                </button>

                <div className={`h-12 w-12 rounded-2xl ${config.iconBg} flex items-center justify-center mb-5`}>
                    {kind === 'expert' ? <Briefcase className={`h-6 w-6 ${config.iconColor}`} /> : kind === 'admin' ? <Shield className={`h-6 w-6 ${config.iconColor}`} /> : <UserPlus className={`h-6 w-6 ${config.iconColor}`} />}
                </div>
                <h3 className="text-2xl font-black tracking-tight text-slate-900">{config.title}</h3>
                <p className="text-sm font-bold text-slate-400 mt-1 mb-7">{config.desc}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField label="Full Name" required>
                        <input
                            type="text"
                            value={form.full_name}
                            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                            placeholder="Jane Doe"
                            required
                        />
                    </FormField>
                    <FormField label="Email" required>
                        <input
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                            placeholder="jane@company.com"
                            required
                        />
                    </FormField>

                    {kind === 'user' && (
                        <>
                            <FormField label="Organization">
                                <input
                                    type="text"
                                    value={form.organization}
                                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                                    placeholder="Acme Co."
                                />
                            </FormField>
                            <FormField label="Phone">
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                                    placeholder="(555) 123-4567"
                                />
                            </FormField>
                            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4 text-xs font-bold text-blue-900 leading-relaxed flex items-start gap-3">
                                <BadgeCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                                <span>After they set a password, they'll land on the AI readiness survey before reaching the dashboard.</span>
                            </div>
                        </>
                    )}

                    {kind === 'admin' && (
                        <>
                            <FormField label="Organization">
                                <input
                                    type="text"
                                    value={form.organization}
                                    onChange={(e) => setForm({ ...form, organization: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                                />
                            </FormField>
                            <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 text-xs font-bold text-slate-700 leading-relaxed flex items-start gap-3">
                                <Shield className="h-5 w-5 text-slate-900 shrink-0 mt-0.5" />
                                <span>Admins land directly in the Command Center with full access — invite carefully.</span>
                            </div>
                        </>
                    )}

                    {kind === 'expert' && (
                        <>
                            <FormField label="LinkedIn URL">
                                <input
                                    type="url"
                                    value={form.linkedin_url}
                                    onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                                    placeholder="https://linkedin.com/in/…"
                                />
                            </FormField>
                            <FormField label="MS Bookings URL">
                                <input
                                    type="url"
                                    value={form.bookings_url}
                                    onChange={(e) => setForm({ ...form, bookings_url: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                                    placeholder="https://outlook.office365.com/owa/calendar/…"
                                />
                            </FormField>
                            <FormField label="Photo URL">
                                <input
                                    type="url"
                                    value={form.photo_url}
                                    onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl py-3 px-4 outline-none focus:border-blue-600 transition-colors font-bold text-slate-900"
                                    placeholder="https://…/photo.jpg"
                                />
                            </FormField>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_bdm}
                                    onChange={(e) => setForm({ ...form, is_bdm: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-xs font-bold text-slate-700">Mark as BDM (business development manager)</span>
                            </label>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={submitting}
                        className={`w-full inline-flex items-center justify-center gap-2 ${config.accent} text-white font-black text-sm uppercase tracking-widest px-6 py-4 rounded-2xl transition-colors disabled:opacity-60 mt-2`}
                    >
                        {submitting
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <Mail className="h-4 w-4" />}
                        {submitting ? 'Sending invite…' : 'Send Invite'}
                    </button>
                </form>
            </motion.div>
        </motion.div>
    );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 block">
                {label}{required && <span className="text-rose-500 ml-1">*</span>}
            </span>
            {children}
        </label>
    );
}
