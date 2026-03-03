'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AUDIT_QUESTIONS } from '@/lib/audit-questions';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import {
    Users,
    ArrowRight,
    TrendingUp,
    Eye,
    Plus,
    Loader2,
    CheckCircle2,
    ShieldAlert,
    ShieldOff,
    LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, Printer, Mail } from 'lucide-react';

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
    const [stats, setStats] = useState({
        totalExperts: 0,
        totalProfiles: 0,
        totalAudits: 0
    });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);

    // Audit Modal State
    const [selectedAudit, setSelectedAudit] = useState<any>(null);
    const [auditDetails, setAuditDetails] = useState<any[]>([]);
    const [loadingAudit, setLoadingAudit] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        setLoading(true);
        await supabase.auth.signOut();
        router.push('/auth');
    };

    const handleViewAudit = async (userRow: any) => {
        const score = Array.isArray(userRow.audit_scores) ? userRow.audit_scores[0] : userRow.audit_scores;
        if (!score) return;

        setSelectedAudit({ user: userRow, score });
        setLoadingAudit(true);

        try {
            const { data, error } = await supabase
                .from('audit_responses')
                .select('*')
                .eq('user_id', userRow.id);

            if (data) {
                setAuditDetails(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAudit(false);
        }
    };

    const handleEmailExpert = async () => {
        if (!selectedAudit) return;
        const expertObj = Array.isArray(selectedAudit.user.experts) ? selectedAudit.user.experts[0] : selectedAudit.user.experts;

        if (!expertObj?.email) {
            alert('This expert does not have an email address on file. Please add one in the Experts section.');
            return;
        }

        setIsSendingEmail(true);
        setEmailSent(false);

        // Build formatted answers from auditDetails
        const formattedAnswers = auditDetails.map((resp: any) => ({
            question: resp.question_id?.replace(/_/g, ' ') || 'Question',
            answer: typeof resp.answer === 'object' ? JSON.stringify(resp.answer) : String(resp.answer),
            category: resp.category || ''
        }));

        try {
            const res = await fetch('/api/send-expert-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expertEmail: expertObj.email,
                    expertName: expertObj.full_name,
                    userName: selectedAudit.user.full_name || 'Unknown User',
                    userEmail: selectedAudit.user.email || '',
                    userOrg: selectedAudit.user.organization || '',
                    score: selectedAudit.score?.overall_score ?? 0,
                    categoryScores: selectedAudit.score?.category_scores ?? [],
                    answers: formattedAnswers,
                })
            });

            const json = await res.json();
            if (json.success) {
                setEmailSent(true);
                setTimeout(() => setEmailSent(false), 4000);
            } else {
                alert('Failed to send email: ' + (json.error || 'Unknown error'));
            }
        } catch (err) {
            alert('Error sending email. Please try again.');
        } finally {
            setIsSendingEmail(false);
        }
    };

    useEffect(() => {
        async function checkAdmin() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    router.push('/auth');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                const profile = data as { is_admin: boolean } | null;

                if (error || !profile?.is_admin) {
                    setIsAdmin(false);
                } else {
                    setIsAdmin(true);
                    // Fetch stats if admin
                    const [expertsRes, profilesRes, scoresRes, profilesListRes, expertsListRes, scoresListRes] = await Promise.all([
                        supabase.from('experts').select('*', { count: 'exact', head: true }),
                        supabase.from('profiles').select('*', { count: 'exact', head: true }),
                        supabase.from('audit_scores').select('*', { count: 'exact', head: true }),
                        supabase.from('profiles')
                            .select(`id, full_name, email, organization, has_completed_audit, assigned_expert_id, updated_at`)
                            .order('updated_at', { ascending: false })
                            .limit(50),
                        supabase.from('experts').select('id, full_name, photo_url, email'),
                        supabase.from('audit_scores').select('user_id, created_at, overall_score')
                    ]);

                    setStats({
                        totalExperts: expertsRes.count || 0,
                        totalProfiles: profilesRes.count || 0,
                        totalAudits: scoresRes.count || 0
                    });

                    if (profilesListRes.error) {
                        console.error("Dashboard fetch error details:", profilesListRes.error);
                    }

                    if (profilesListRes.data) {
                        const allExperts = expertsListRes.data || [];
                        const allScores = scoresListRes.data || [];

                        const mergedProfiles = profilesListRes.data.map((profile: any) => {
                            const expert = allExperts.find((e: any) => e.id === profile.assigned_expert_id);
                            // Get the most recent score for the user
                            const userScores = allScores.filter((s: any) => s.user_id === profile.id).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                            const score = userScores.length > 0 ? userScores[0] : null;

                            return {
                                ...profile,
                                experts: expert ? [expert] : [],
                                audit_scores: score ? [score] : []
                            };
                        });
                        setRecentUsers(mergedProfiles);
                    }

                }
            } catch (err) {
                console.error("Auth check failed:", err);
                setIsAdmin(false);
            } finally {
                setLoading(false);
            }
        }
        checkAdmin();
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (isAdmin === false) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white rounded-[48px] p-12 text-center shadow-xl border border-slate-100">
                    <div className="h-20 w-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mx-auto mb-8 shadow-inner">
                        <ShieldAlert className="h-10 w-10" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Access Denied</h1>
                    <p className="text-slate-500 font-bold leading-relaxed mb-10">
                        This area is restricted to system administrators. Please contact your coordinator if you believe this is an error.
                    </p>
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] hover:bg-black transition-all flex items-center justify-center gap-2 group"
                        >
                            Return to Dashboard
                            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-full bg-white text-red-600 border border-red-100 font-black py-5 rounded-[24px] hover:bg-red-50 transition-all flex items-center justify-center gap-2 group"
                        >
                            <LogOut className="h-5 w-5" />
                            Sign Out & Switch Account
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />

            <main className="pl-64 pr-10 pt-10 pb-20">
                {/* Header */}
                <header className="flex items-end justify-between mb-12">
                    <div>
                        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-[0.2em] text-[10px] mb-3">
                            <CheckCircle2 className="h-3 w-3" />
                            System Active
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Admin Control Center</h1>
                    </div>
                    <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-slate-100 shadow-sm">
                        <button
                            onClick={() => router.push('/admin/experts/new')}
                            className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all flex items-center gap-3"
                        >
                            <Plus className="h-5 w-5" />
                            Add New Expert
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    {[
                        { label: 'Active Experts', value: stats.totalExperts, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Total Users', value: stats.totalProfiles, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                        { label: 'Audits Completed', value: stats.totalAudits, icon: Eye, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500"
                        >
                            <div className={`h-16 w-16 rounded-[24px] ${stat.bg} ${stat.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                                <stat.icon className="h-8 w-8" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                                <p className="text-4xl font-black text-slate-900 tabular-nums">{stat.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-12 gap-8">
                    <section className="col-span-12 bg-white rounded-[48px] p-10 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                                <div className="h-10 w-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <Users className="h-5 w-5" />
                                </div>
                                Recent User Accounts
                            </h2>
                            <button
                                onClick={() => router.push('/admin/users')}
                                className="text-slate-400 font-bold hover:text-blue-600 transition-colors uppercase tracking-widest text-xs flex items-center gap-2"
                            >
                                View All Users <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100">
                                        <th className="pb-4 pt-2 text-xs font-black uppercase tracking-widest text-slate-400">User</th>
                                        <th className="pb-4 pt-2 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                                        <th className="pb-4 pt-2 text-xs font-black uppercase tracking-widest text-slate-400">Readiness Score</th>
                                        <th className="pb-4 pt-2 text-xs font-black uppercase tracking-widest text-slate-400">Assigned Expert</th>
                                        <th className="pb-4 pt-2 text-xs font-black uppercase tracking-widest text-slate-400 text-right">Account Created</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-400 font-bold">
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentUsers.map((userRow, idx) => {
                                            const scoreObj = Array.isArray(userRow.audit_scores) ? userRow.audit_scores[0] : userRow.audit_scores;
                                            const expertObj = Array.isArray(userRow.experts) ? userRow.experts[0] : userRow.experts;

                                            // Fallback to the profile's original creation date if they haven't made a score yet
                                            const rawDate = scoreObj?.created_at || userRow.updated_at;
                                            const completionDate = rawDate
                                                ? new Date(rawDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                                : 'Unknown';

                                            return (
                                                <tr key={userRow.id || idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                    <td className="py-4 font-black flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center uppercase shrink-0">
                                                            {userRow.full_name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="truncate max-w-[180px]">{userRow.full_name || 'Unknown User'}</span>
                                                            <span className="text-xs font-bold text-slate-400 truncate max-w-[180px]" title={userRow.email}>{userRow.email || 'No email provided'}</span>
                                                            {userRow.organization && <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-0.5 truncate max-w-[180px]">{userRow.organization}</span>}
                                                        </div>
                                                    </td>
                                                    <td className="py-4">
                                                        {userRow.has_completed_audit ? (
                                                            <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1 w-max">
                                                                <CheckCircle2 className="h-3 w-3" /> Audit Complete
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-600 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1 w-max">
                                                                Pending
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4">
                                                        {scoreObj?.overall_score ? (
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-900">{scoreObj.overall_score}%</span>
                                                                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-0.5 whitespace-nowrap">
                                                                    {scoreObj.overall_score >= 65 ? 'Advanced (Tier 1)' : 'Foundation (Tier 2)'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-300 font-bold">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="py-4">
                                                        {expertObj ? (
                                                            <div className="flex items-center gap-2">
                                                                {expertObj.photo_url ? (
                                                                    <div className="h-8 w-8 rounded-full overflow-hidden bg-slate-200 border border-slate-100">
                                                                        <img src={expertObj.photo_url} alt={expertObj.full_name} className="h-full w-full object-cover" />
                                                                    </div>
                                                                ) : (
                                                                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                                                        <Users className="h-4 w-4" />
                                                                    </div>
                                                                )}
                                                                <span className="font-bold text-slate-600 text-sm">{expertObj.full_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs font-bold uppercase tracking-widest text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-right">
                                                        <div className="flex items-center justify-end gap-3">
                                                            <span className="font-bold text-slate-500 text-sm hidden sm:inline-block">{completionDate}</span>
                                                            {scoreObj && (
                                                                <button onClick={() => handleViewAudit(userRow)} className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-1 shadow-sm border border-blue-100 shrink-0">
                                                                    <Eye className="h-3 w-3" /> View
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            </main>

            {/* Audit Details Modal */}
            <AnimatePresence>
                {selectedAudit && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-100"
                            id="audit-print-area"
                        >
                            {/* Modal Header */}
                            <div className="p-6 sm:p-8 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xl uppercase shrink-0">
                                            {selectedAudit.user.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900">{selectedAudit.user.full_name}</h2>
                                            <p className="text-sm font-bold text-slate-500">
                                                {selectedAudit.user.email || 'No Email'} {selectedAudit.user.organization && `• ${selectedAudit.user.organization}`}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 no-print">
                                    <button
                                        onClick={handleEmailExpert}
                                        disabled={isSendingEmail}
                                        className={`h-10 px-4 rounded-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest transition-colors shadow-sm shrink-0 ${emailSent
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-slate-900 text-white hover:bg-slate-700'
                                            } disabled:opacity-50`}
                                    >
                                        {isSendingEmail ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : emailSent ? (
                                            <><CheckCircle2 className="h-4 w-4" /> Sent!</>
                                        ) : (
                                            <><Mail className="h-4 w-4" /> Email Expert</>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => window.print()}
                                        className="h-10 px-4 bg-blue-600 text-white rounded-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-colors shadow-sm shrink-0"
                                    >
                                        <Printer className="h-4 w-4" />
                                        Print / PDF
                                    </button>
                                    <button onClick={() => setSelectedAudit(null)} className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm border border-slate-200 shrink-0">
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 sm:p-8 overflow-y-auto flex-1 bg-[#F8FAFC]">
                                {loadingAudit ? (
                                    <div className="flex py-20 items-center justify-center">
                                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        {/* Score Overview */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
                                                <div className="h-20 w-20 rounded-[20px] bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-lg shadow-blue-600/20 shrink-0">
                                                    <div className="h-full w-full bg-white rounded-[18px] flex items-center justify-center flex-col">
                                                        <span className="text-2xl font-black text-slate-900 leading-none">{selectedAudit.score.overall_score}%</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Overall Readiness</p>
                                                    <p className="text-lg font-black text-blue-600">{selectedAudit.score.overall_score >= 65 ? 'Advanced (Tier 1)' : 'Foundation (Tier 2)'}</p>
                                                </div>
                                            </div>
                                            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Category Breakdown</h4>
                                                <div className="space-y-3">
                                                    {(selectedAudit.score.category_scores ?? []).map((cat: any, i: number) => (
                                                        <div key={i} className="flex items-center gap-3">
                                                            <span className="text-xs font-bold text-slate-600 w-24 truncate">{cat.category}</span>
                                                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${cat.score}%` }} />
                                                            </div>
                                                            <span className="text-xs font-black text-slate-900 w-8">{cat.score}%</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                                            <div className="p-6 border-b border-slate-100 bg-slate-50">
                                                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                                    <FileText className="h-5 w-5 text-blue-600" /> Audit Responses
                                                </h3>
                                            </div>
                                            <div className="divide-y divide-slate-100">
                                                {auditDetails.length > 0 ? auditDetails.map((resp, i) => {
                                                    const questionDef = AUDIT_QUESTIONS.find(q => q.id === resp.question_id);
                                                    const questionText = questionDef ? questionDef.text : resp.question_id.replace(/_/g, ' ');
                                                    const categoryLabel = questionDef ? questionDef.category.charAt(0).toUpperCase() + questionDef.category.slice(1) : null;

                                                    // Resolve answer: if it's a number, find the matching option label
                                                    let answerDisplay: string;
                                                    const rawAnswer = resp.answer;
                                                    if (questionDef && (typeof rawAnswer === 'number' || !isNaN(Number(rawAnswer)))) {
                                                        const matchedOption = questionDef.options.find(o => o.value === Number(rawAnswer));
                                                        answerDisplay = matchedOption ? matchedOption.label : String(rawAnswer);
                                                    } else if (typeof rawAnswer === 'string') {
                                                        answerDisplay = rawAnswer;
                                                    } else {
                                                        answerDisplay = JSON.stringify(rawAnswer);
                                                    }

                                                    return (
                                                        <div key={i} className="p-6 hover:bg-slate-50/50 transition-colors">
                                                            <div className="flex items-start gap-4">
                                                                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 font-black flex items-center justify-center shrink-0 text-sm">
                                                                    {i + 1}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    {categoryLabel && (
                                                                        <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-500 border border-indigo-100 px-2 py-0.5 rounded-full mb-2">
                                                                            {categoryLabel}
                                                                        </span>
                                                                    )}
                                                                    <p className="font-bold text-slate-900 mb-2">{questionText}</p>
                                                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-900 font-semibold">
                                                                        {answerDisplay}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                }) : (
                                                    <div className="p-8 text-center text-slate-400 font-bold">No detailed responses found.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
