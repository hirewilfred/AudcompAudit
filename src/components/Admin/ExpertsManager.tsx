import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
    Users, Plus, Edit3, Trash2, Linkedin, Mail, Calendar, Search, Loader2, ExternalLink, ArrowLeft, Save, Upload, X, CheckCircle2, User
} from 'lucide-react';
import { Database } from '@/lib/database.types';

type Expert = Database['public']['Tables']['experts']['Row'];

export default function ExpertsManager() {
    const [view, setView] = useState<'list' | 'new' | 'edit'>('list');
    const [editingExpertId, setEditingExpertId] = useState<string | null>(null);

    return (
        <div className="w-full">
            {view === 'list' && (
                <ExpertsList 
                    onNew={() => setView('new')} 
                    onEdit={(id) => { setEditingExpertId(id); setView('edit'); }} 
                />
            )}
            {view === 'new' && (
                <ExpertForm 
                    onBack={() => setView('list')} 
                    onSaved={() => setView('list')} 
                />
            )}
            {view === 'edit' && editingExpertId && (
                <ExpertForm 
                    expertId={editingExpertId} 
                    onBack={() => setView('list')} 
                    onSaved={() => setView('list')} 
                />
            )}
        </div>
    );
}

function ExpertsList({ onNew, onEdit }: { onNew: () => void, onEdit: (id: string) => void }) {
    const [loading, setLoading] = useState(true);
    const [experts, setExperts] = useState<Expert[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const supabase = createClient();

    const fetchExperts = async () => {
        try {
            const { data, error } = await supabase.from('experts').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setExperts(data as any || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchExperts(); }, []);

    const handleDelete = async (id: string) => {
        setIsDeleting(id);
        try {
            const { error } = await supabase.from('experts').delete().eq('id', id);
            if (error) throw error;
            setExperts(prev => prev.filter(e => e.id !== id));
        } catch (err) {
            console.error(err);
            alert("Failed to delete.");
        } finally {
            setIsDeleting(null);
        }
    };

    const filteredExperts = experts.filter(e => 
        (e.full_name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
        (e.email?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tight">Expert Directory</h1>
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mt-2">Manage your team of AI specialists</p>
                </div>
                <button
                    onClick={onNew}
                    className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-colors flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" /> Add New Expert
                </button>
            </div>

            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:border-blue-500/50 transition-colors text-white placeholder:text-slate-500"
                />
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 text-blue-500 animate-spin" /></div>
            ) : experts.length === 0 ? (
                <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-16 text-center border border-white/5">
                    <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-white mb-2">No experts found</h3>
                    <button onClick={onNew} className="text-blue-400 hover:text-blue-300 font-bold mt-4">Create your first expert</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredExperts.map(expert => (
                        <div key={expert.id} className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="flex items-start justify-between mb-4">
                                <div className="h-16 w-16 rounded-2xl bg-black/40 overflow-hidden border border-white/5">
                                    {expert.photo_url ? (
                                        <img src={expert.photo_url} alt={expert.full_name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-slate-500"><Users className="h-6 w-6" /></div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => onEdit(expert.id)} className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"><Edit3 className="h-4 w-4" /></button>
                                    <button 
                                        onClick={() => { if(confirm('Delete expert?')) handleDelete(expert.id); }}
                                        disabled={isDeleting === expert.id}
                                        className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-red-400 transition-colors"
                                    >
                                        {isDeleting === expert.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-1">{expert.full_name}</h3>
                            <div className="flex flex-col gap-2 mt-4">
                                {expert.email && <div className="flex items-center gap-2 text-sm text-slate-400"><Mail className="h-4 w-4 text-blue-400" />{expert.email}</div>}
                                {expert.linkedin_url && <a href={expert.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400"><Linkedin className="h-4 w-4 text-blue-500" />LinkedIn Profile</a>}
                                {expert.bookings_url && <a href={expert.bookings_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-400"><Calendar className="h-4 w-4 text-emerald-500" />Bookings URL</a>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function ExpertForm({ expertId, onBack, onSaved }: { expertId?: string, onBack: () => void, onSaved: () => void }) {
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [formData, setFormData] = useState({ full_name: '', email: '', linkedin_url: '', bookings_url: '', photo_url: '', is_bdm: false });
    const supabase = createClient();

    useEffect(() => {
        if (expertId) {
            supabase.from('experts').select('*').eq('id', expertId).single().then(({ data }) => {
                if (data) {
                    const d = data as any;
                    setFormData({
                        full_name: d.full_name || '',
                        email: d.email || '',
                        linkedin_url: d.linkedin_url || '',
                        bookings_url: d.bookings_url || '',
                        photo_url: d.photo_url || '',
                        is_bdm: d.is_bdm || false
                    });
                }
            });
        }
    }, [expertId]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const fileName = `${Math.random()}.${file.name.split('.').pop()}`;
            const { error } = await supabase.storage.from('experts').upload(`expert-photos/${fileName}`, file);
            if (error) throw error;
            const { data } = supabase.storage.from('experts').getPublicUrl(`expert-photos/${fileName}`);
            setFormData(prev => ({ ...prev, photo_url: data.publicUrl }));
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (expertId) {
                await supabase.from('experts').update(formData).eq('id', expertId);
            } else {
                await supabase.from('experts').insert([formData]);
            }
            onSaved();
        } catch (err) {
            console.error(err);
            alert("Save failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"><ArrowLeft className="h-5 w-5 text-white" /></button>
                <h1 className="text-3xl font-black text-white tracking-tight">{expertId ? 'Edit Expert' : 'Add New Expert'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 space-y-4">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><User className="h-5 w-5 text-blue-400" /> Details</h2>
                        <div>
                            <label className="text-xs font-bold text-slate-400">Full Name</label>
                            <input required type="text" value={formData.full_name} onChange={e => setFormData(p => ({...p, full_name: e.target.value}))} className="w-full mt-1 bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400">Email Address</label>
                            <input type="email" value={formData.email} onChange={e => setFormData(p => ({...p, email: e.target.value}))} className="w-full mt-1 bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm font-bold text-white">Business Development Manager</span>
                            <button type="button" onClick={() => setFormData(p => ({...p, is_bdm: !p.is_bdm}))} className={`relative inline-flex h-6 w-11 rounded-full transition-colors ${formData.is_bdm ? 'bg-blue-600' : 'bg-white/10'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${formData.is_bdm ? 'translate-x-6 mt-1' : 'translate-x-1 mt-1'}`} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 space-y-4">
                        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Linkedin className="h-5 w-5 text-blue-400" /> Links</h2>
                        <div>
                            <label className="text-xs font-bold text-slate-400">LinkedIn URL</label>
                            <input type="url" value={formData.linkedin_url} onChange={e => setFormData(p => ({...p, linkedin_url: e.target.value}))} className="w-full mt-1 bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400">Bookings URL</label>
                            <input type="url" value={formData.bookings_url} onChange={e => setFormData(p => ({...p, bookings_url: e.target.value}))} className="w-full mt-1 bg-black/20 border border-white/10 rounded-xl py-3 px-4 text-white outline-none focus:border-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-6 border border-white/5 text-center">
                        <h2 className="text-xs font-bold text-slate-400 mb-4">Profile Photo</h2>
                        <div className="relative h-40 w-40 mx-auto mb-4 rounded-2xl bg-black/20 border border-white/10 overflow-hidden flex items-center justify-center">
                            {formData.photo_url ? (
                                <>
                                    <img src={formData.photo_url} className="h-full w-full object-cover" />
                                    <button type="button" onClick={() => setFormData(p => ({...p, photo_url: ''}))} className="absolute top-2 right-2 p-1 bg-red-500 rounded text-white"><X className="h-4 w-4"/></button>
                                </>
                            ) : uploading ? (
                                <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                            ) : (
                                <div className="text-slate-500"><Upload className="h-8 w-8 mb-2 mx-auto" /><span className="text-xs font-bold">Upload</span></div>
                            )}
                            {!formData.photo_url && !uploading && <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />}
                        </div>
                    </div>
                    <button type="submit" disabled={loading || uploading} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />} Save Expert
                    </button>
                </div>
            </form>
        </div>
    );
}
