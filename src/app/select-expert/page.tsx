'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronDown, Loader2, Sparkles, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function SelectExpertPage() {
    const [experts, setExperts] = useState<any[]>([]);
    const [selectedExpertId, setSelectedExpertId] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingExperts, setFetchingExperts] = useState(true);
    const [userProfile, setUserProfile] = useState<{ assigned_expert_id?: string; full_name?: string } | null>(null);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function loadData() {
            setFetchingExperts(true);
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/auth');
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single() as { data: any; error: any };

                setUserProfile(profile);

                // If they already have an expert, they can still change it here, but we'll pre-select it
                if (profile?.assigned_expert_id) {
                    setSelectedExpertId(profile.assigned_expert_id);
                }

                const { data: expertData } = await supabase
                    .from('experts')
                    .select('id, full_name')
                    .order('full_name');

                if (expertData) {
                    setExperts(expertData);
                }
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setFetchingExperts(false);
            }
        }
        loadData();
    }, []);

    const handleSave = async () => {
        if (!selectedExpertId) return;
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            let finalExpertId = selectedExpertId;
            if (selectedExpertId === 'not-sure' && experts.length > 0) {
                const randomIndex = Math.floor(Math.random() * experts.length);
                finalExpertId = experts[randomIndex].id;
            }

            const { error } = await (supabase.from('profiles') as any).update({
                assigned_expert_id: finalExpertId,
                updated_at: new Date().toISOString()
            }).eq('id', session.user.id);

            if (error) throw error;
            router.push('/dashboard');
        } catch (err) {
            console.error("Error saving expert:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/auth');
    };

    if (fetchingExperts) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE]">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#F4F7FE] px-6 py-20">
            {/* Background elements */}
            <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-600/5 blur-[120px] pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl shadow-blue-900/5 border border-slate-100/50 p-10 md:p-16 relative overflow-hidden"
            >
                {/* Accent line */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

                <div className="flex flex-col items-center text-center">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-blue-600 border border-blue-100/50">
                        <ShieldCheck className="h-3 w-3" />
                        Onboarding Final Step
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6 tracking-tight">
                        Connect with your AI Expert
                    </h1>

                    <p className="text-slate-500 font-medium mb-12 max-w-md leading-relaxed">
                        To build your personalized implementation roadmap, we need to link your account to your assigned advisor or sales representative.
                    </p>

                    <div className="w-full space-y-8">
                        <div className="text-left space-y-3">
                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Which expert are you working with?</label>
                            <div className="relative group">
                                <User className="absolute left-6 top-1/2 h-6 w-6 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <select
                                    required
                                    value={selectedExpertId}
                                    onChange={(e) => setSelectedExpertId(e.target.value)}
                                    className="w-full rounded-[32px] border border-slate-100 bg-slate-50 py-7 pl-16 pr-12 text-xl text-slate-900 outline-none transition-all focus:border-blue-600 focus:bg-white focus:ring-8 focus:ring-blue-600/5 font-bold appearance-none cursor-pointer"
                                >
                                    <option value="" disabled>Search or select expert name...</option>
                                    <option value="not-sure">I'm not sure / Not working with anyone yet</option>
                                    {experts.map((expert) => (
                                        <option key={expert.id} value={expert.id}>
                                            {expert.full_name}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 text-slate-400">
                                    <ChevronDown className="h-6 w-6" />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4">
                            <button
                                onClick={handleSave}
                                disabled={loading || !selectedExpertId}
                                className="w-full bg-blue-600 text-white font-black py-7 rounded-[32px] text-xl shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                            >
                                {loading ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : (
                                    <>
                                        Enter Dashboard
                                        <ArrowRight className="h-6 w-6" />
                                    </>
                                )}
                            </button>

                            <button
                                onClick={handleLogout}
                                className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <LogOut className="h-4 w-4" />
                                Logged in as {userProfile?.full_name || 'User'}? Sign Out
                            </button>
                        </div>
                    </div>

                    <div className="mt-12 p-6 rounded-[32px] bg-slate-50 border border-slate-100/50 flex items-start gap-4 text-left">
                        <div className="h-10 w-10 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                            <Sparkles className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1">Why this matters</p>
                            <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                                Linking your account ensures your expert can see your audit results and prepare the right strategy for your consultation.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
