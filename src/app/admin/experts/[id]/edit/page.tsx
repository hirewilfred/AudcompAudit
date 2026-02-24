'use client';

import { useEffect, useState, use } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import {
    ArrowLeft,
    Save,
    Upload,
    X,
    User,
    Mail,
    Linkedin,
    Calendar,
    Loader2,
    CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Database } from '@/lib/database.types';

export default function EditExpertPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        linkedin_url: '',
        bookings_url: '',
        photo_url: ''
    });

    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        async function fetchExpert() {
            try {
                const { data, error } = await (supabase
                    .from('experts') as any)
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        full_name: data.full_name || '',
                        email: data.email || '',
                        linkedin_url: data.linkedin_url || '',
                        bookings_url: data.bookings_url || '',
                        photo_url: data.photo_url || ''
                    });
                }
            } catch (err) {
                console.error("Error fetching expert:", err);
                alert("Failed to load expert data.");
                router.push('/admin/experts');
            } finally {
                setLoading(false);
            }
        }
        fetchExpert();
    }, [id]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `expert-photos/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('experts')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('experts')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, photo_url: data.publicUrl }));
        } catch (err) {
            console.error("Error uploading photo:", err);
            alert("Failed to upload photo.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { error } = await (supabase.from('experts') as any)
                .update(formData)
                .eq('id', id);

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/admin/experts');
            }, 1000);
        } catch (err) {
            console.error("Error updating expert:", err);
            alert("Failed to update expert.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50">
                <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mx-auto mb-6 shadow-lg shadow-emerald-500/10">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Expert Updated!</h2>
                    <p className="text-slate-400 font-bold">Saving changes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />

            <main className="pl-64 pr-10 pt-10 pb-20">
                <header className="flex items-center gap-6 mb-12">
                    <button
                        onClick={() => router.back()}
                        className="h-12 w-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:shadow-lg transition-all"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">Edit Expert</h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Update specialist details and credentials</p>
                    </div>
                </header>

                <form onSubmit={handleSubmit} className="max-w-4xl grid grid-cols-12 gap-8">
                    {/* Left Side - Profile Info */}
                    <div className="col-span-12 lg:col-span-8 space-y-8">
                        <section className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <User className="h-5 w-5 text-blue-500" />
                                Personal Information
                            </h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Full Name</label>
                                    <input
                                        required
                                        type="text"
                                        placeholder="Full Name"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <input
                                            type="email"
                                            placeholder="sarah.m@audcomp.ai"
                                            value={formData.email}
                                            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100">
                            <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                                <Linkedin className="h-5 w-5 text-blue-600" />
                                Social & Integration
                            </h2>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">LinkedIn Profile URL</label>
                                    <input
                                        type="url"
                                        placeholder="https://linkedin.com/in/username"
                                        value={formData.linkedin_url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin_url: e.target.value }))}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Microsoft Bookings URL</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                                        <input
                                            type="url"
                                            placeholder="Microsoft Bookings URL"
                                            value={formData.bookings_url}
                                            onChange={(e) => setFormData(prev => ({ ...prev, bookings_url: e.target.value }))}
                                            className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Side - Photo Upload */}
                    <div className="col-span-12 lg:col-span-4 space-y-8">
                        <section className="bg-white rounded-[40px] p-10 shadow-sm border border-slate-100 text-center">
                            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Profile Photo</h2>

                            <div className="relative h-48 w-48 mx-auto mb-8 group">
                                <div className="h-full w-full rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200 overflow-hidden flex items-center justify-center transition-all group-hover:border-blue-400 group-hover:bg-blue-50">
                                    {formData.photo_url ? (
                                        <div className="relative h-full w-full">
                                            <img src={formData.photo_url} alt="Preview" className="h-full w-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, photo_url: '' }))}
                                                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : uploading ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                                            <span className="text-[10px] font-black text-blue-600 uppercase">Uploading...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-300 group-hover:text-blue-500 transition-colors">
                                            <Upload className="h-10 w-10" />
                                            <span className="text-[10px] font-black uppercase">Replace Image</span>
                                        </div>
                                    )}
                                </div>
                                {!formData.photo_url && !uploading && (
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                )}
                            </div>
                        </section>

                        <button
                            type="submit"
                            disabled={saving || uploading}
                            className="w-full bg-blue-600 text-white font-black py-6 rounded-[32px] shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100"
                        >
                            {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                            <span className="text-lg uppercase tracking-widest">Update Expert</span>
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
