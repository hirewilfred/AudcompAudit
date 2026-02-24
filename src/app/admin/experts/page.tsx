'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import {
    Users,
    Plus,
    Edit3,
    Trash2,
    Linkedin,
    Mail,
    Calendar,
    Search,
    Loader2,
    ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExpertsListPage() {
    const [loading, setLoading] = useState(true);
    const [experts, setExperts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const fetchExperts = async () => {
        try {
            const { data, error } = await supabase
                .from('experts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setExperts(data || []);
        } catch (err) {
            console.error("Error fetching experts:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExperts();
    }, []);

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            const { error } = await supabase
                .from('experts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setExperts(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error("Error deleting expert:", err);
            alert("Failed to delete expert. Please try again.");
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredExperts = experts.filter(expert =>
        (expert.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (expert.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />

            <main className="pl-64 pr-10 pt-10 pb-20">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-3">Expert Directory</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Manage your team of AI specialists</p>
                    </div>
                    <button
                        onClick={() => router.push('/admin/experts/new')}
                        className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:scale-[1.02] transition-all flex items-center gap-3"
                    >
                        <Plus className="h-5 w-5" />
                        Add New Expert
                    </button>
                </header>

                {/* Search Bar */}
                <div className="relative mb-10 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-100 rounded-[32px] py-6 pl-16 pr-8 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 shadow-sm focus:shadow-xl focus:shadow-blue-900/5 placeholder:text-slate-300"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
                    </div>
                ) : experts.length === 0 ? (
                    <div className="bg-white rounded-[48px] p-20 text-center border border-slate-100 border-dashed">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-6">
                            <Users className="h-10 w-10" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">No experts found</h3>
                        <p className="text-slate-400 font-bold mb-8">Start by adding your first AI specialist to the directory.</p>
                        <button
                            onClick={() => router.push('/admin/experts/new')}
                            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all"
                        >
                            Create First Expert
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                        <AnimatePresence mode="popLayout">
                            {filteredExperts.map((expert, i) => (
                                <motion.div
                                    key={expert.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.3 }}
                                    className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500"
                                >
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="h-20 w-20 rounded-3xl bg-slate-100 overflow-hidden shadow-inner border border-slate-50 group-hover:scale-105 transition-transform duration-500">
                                            {expert.photo_url ? (
                                                <img src={expert.photo_url} alt={expert.full_name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-slate-300">
                                                    <Users className="h-10 w-10" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => router.push(`/admin/experts/${expert.id}/edit`)}
                                                className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center"
                                            >
                                                <Edit3 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (confirm('Are you sure you want to delete this expert?')) handleDelete(expert.id);
                                                }}
                                                disabled={isDeleting === expert.id}
                                                className="h-10 w-10 rounded-xl bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center disabled:opacity-50"
                                            >
                                                {isDeleting === expert.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 mb-2 leading-none">{expert.full_name}</h3>
                                    <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-slate-50">
                                        {expert.email && (
                                            <div className="flex items-center gap-3 text-slate-500 font-bold text-sm">
                                                <Mail className="h-4 w-4 text-blue-500" />
                                                <span>{expert.email}</span>
                                            </div>
                                        )}
                                        {expert.linkedin_url && (
                                            <a
                                                href={expert.linkedin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 text-slate-500 font-bold text-sm hover:text-blue-600 transition-colors"
                                            >
                                                <Linkedin className="h-4 w-4 text-blue-700" />
                                                <span className="flex-1">LinkedIn Profile</span>
                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        )}
                                        {expert.bookings_url && (
                                            <a
                                                href={expert.bookings_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 text-slate-500 font-bold text-sm hover:text-blue-600 transition-colors"
                                            >
                                                <Calendar className="h-4 w-4 text-emerald-500" />
                                                <span className="flex-1">Microsoft Bookings</span>
                                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </main>
        </div>
    );
}
