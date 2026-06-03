'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, ChevronDown, Loader2, Sparkles, LogOut, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

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
            <div className="flex min-h-screen items-center justify-center bg-[#fbfbfd]">
                <Loader2 className="h-6 w-6 text-[#1d1d1f]/40 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#fbfbfd] px-6 py-20">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-xl"
            >
                <div className="text-center mb-12">
                    <div className="eyebrow mb-4">Onboarding — final step</div>
                    <h1 className="display display-tight text-[#1d1d1f] text-[40px] sm:text-[52px] mb-5">
                        Connect with your AI expert.
                    </h1>
                    <p className="text-[17px] text-[#6e6e73] max-w-md mx-auto leading-[1.45]">
                        To build your personalized implementation roadmap, link your account to your assigned advisor.
                    </p>
                </div>

                <div className="bg-white rounded-[24px] border hairline shadow-[0_24px_70px_-30px_rgba(0,0,0,0.1)] p-8 sm:p-10">
                    <label className="eyebrow block mb-3">Which expert are you working with?</label>
                    <div className="relative group mb-6">
                        <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#86868b]" strokeWidth={1.5} />
                        <select
                            required
                            value={selectedExpertId}
                            onChange={(e) => setSelectedExpertId(e.target.value)}
                            className="w-full rounded-[14px] border hairline bg-white py-4 pl-11 pr-10 text-[15px] text-[#1d1d1f] outline-none transition-all focus:border-[#1d1d1f]/30 focus:ring-2 focus:ring-[#1d1d1f]/5 appearance-none cursor-pointer"
                        >
                            <option value="" disabled>Select expert name…</option>
                            <option value="not-sure">I&apos;m not sure / not working with anyone yet</option>
                            {experts.map((expert) => (
                                <option key={expert.id} value={expert.id}>
                                    {expert.full_name}
                                </option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868b]" strokeWidth={1.5} />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={loading || !selectedExpertId}
                        className="w-full apple-pill apple-pill-primary justify-center py-3.5 disabled:opacity-50"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Enter dashboard
                                <ArrowRight className="h-3.5 w-3.5" />
                            </>
                        )}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full mt-3 py-2 text-[#86868b] text-[13px] hover:text-[#1d1d1f] transition-colors flex items-center justify-center gap-2"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Signed in as {userProfile?.full_name || 'User'}? Sign out
                    </button>
                </div>

                <div className="mt-6 p-6 rounded-[18px] bg-[#f5f5f7] flex items-start gap-4">
                    <div className="h-9 w-9 rounded-full bg-white flex items-center justify-center shrink-0">
                        <Sparkles className="h-4 w-4 text-[#1d1d1f]/60" strokeWidth={1.5} />
                    </div>
                    <div>
                        <p className="text-[14px] font-semibold text-[#1d1d1f] tracking-tight mb-1">Why this matters</p>
                        <p className="text-[13px] text-[#6e6e73] leading-[1.5]">
                            Linking your account lets your expert see your audit results and prepare the right strategy for your consultation.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
