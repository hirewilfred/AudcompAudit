'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Linkedin, Loader2, CheckCircle2, X as XIcon, Clock, Calendar,
} from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';

type Post = {
    id: string;
    expert_id: string;
    platform: string;
    body: string;
    hashtags: string[];
    status: 'draft' | 'pending_review' | 'approved' | 'scheduled' | 'posted' | 'failed' | 'declined';
    scheduled_for: string | null;
    posted_at: string | null;
    posted_url: string | null;
    error: string | null;
    created_at: string;
    created_by_agent: string | null;
    expert: { id: string; full_name: string | null; photo_url: string | null } | null;
};

const FILTERS: Post['status'][] = ['pending_review', 'approved', 'scheduled', 'posted', 'failed', 'declined'];

const statusTone = (s: string) =>
    s === 'posted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
        : s === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100'
        : s === 'approved' ? 'bg-blue-50 text-blue-700 border-blue-100'
        : s === 'failed' ? 'bg-rose-50 text-rose-700 border-rose-100'
        : s === 'declined' ? 'bg-slate-50 text-slate-500 border-slate-100'
        : 'bg-amber-50 text-amber-700 border-amber-100';

export default function PostsPage() {
    const [filter, setFilter] = useState<string>('pending_review');
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState<string | null>(null);

    const refresh = async () => {
        setLoading(true);
        const res = await fetch(`/api/admin/posts?status=${filter}`);
        const j = await res.json();
        setPosts(j.posts ?? []);
        setLoading(false);
    };
    useEffect(() => { refresh(); }, [filter]);

    const act = async (id: string, action: 'approve' | 'decline' | 'schedule', scheduled_for?: string) => {
        setBusy(id);
        await fetch('/api/admin/posts', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, action, scheduled_for }),
        });
        setBusy(null);
        refresh();
    };

    return (
        <div className="min-h-screen bg-[#F4F7FE] text-slate-800">
            <div className="fixed top-[-10%] right-[-5%] h-[600px] w-[600px] rounded-full bg-blue-600/5 blur-[120px] pointer-events-none" />
            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                <div className="max-w-7xl mx-auto">
                    <Link href="/admin/outreach" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-4">
                        <ArrowLeft className="h-3 w-3" /> Back to Outreach
                    </Link>

                    <div className="relative mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-900 p-8 md:p-10 shadow-xl shadow-blue-900/20">
                        <div
                            className="absolute inset-0 opacity-30 pointer-events-none"
                            style={{
                                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.35) 1px, transparent 0)',
                                backgroundSize: '24px 24px',
                            }}
                        />
                        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-blue-500/30 blur-[120px] pointer-events-none" />
                        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 text-blue-300 font-bold text-xs uppercase tracking-widest mb-3">
                                <Linkedin className="h-3 w-3" /> Content queue
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-[1.05]">
                                LinkedIn <span className="bg-gradient-to-r from-blue-300 to-indigo-200 bg-clip-text text-transparent">posts</span>
                            </h1>
                            <p className="text-blue-100/80 text-sm mt-3 max-w-2xl leading-relaxed">
                                Drafts produced by the content-poster agent. Approve to schedule, decline to discard. Scheduled posts publish through PhantomBuster on the expert's account.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {FILTERS.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${
                                    filter === f ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                                {f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 text-blue-600 animate-spin" /></div>
                    ) : posts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
                            <Linkedin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 font-medium">No posts in “{filter.replace('_', ' ')}” right now.</p>
                            <p className="text-xs text-slate-400 mt-2">Run a content-poster mission to seed the queue.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {posts.map(p => (
                                <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                                    <div className="flex items-center gap-3 mb-3">
                                        {p.expert?.photo_url ? (
                                            <img src={p.expert.photo_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 text-xs font-black">
                                                {(p.expert?.full_name || 'E').charAt(0)}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-slate-900 truncate">{p.expert?.full_name || 'Unassigned expert'}</div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                                <Linkedin className="h-3 w-3" /> {p.platform} · {p.created_by_agent ?? 'manual'}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${statusTone(p.status)}`}>
                                            {p.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <p className="text-[13px] text-slate-800 leading-relaxed whitespace-pre-line bg-slate-50 border border-slate-100 rounded-lg p-3">
                                        {p.body}
                                    </p>
                                    {p.hashtags?.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {p.hashtags.map(h => (
                                                <span key={h} className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">#{h.replace(/^#/, '')}</span>
                                            ))}
                                        </div>
                                    )}
                                    {p.scheduled_for && (
                                        <div className="text-[11px] text-slate-500 font-medium mt-3 inline-flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" /> Scheduled for {new Date(p.scheduled_for).toLocaleString()}
                                        </div>
                                    )}
                                    {p.posted_url && (
                                        <a href={p.posted_url} target="_blank" rel="noreferrer" className="text-[11px] font-bold text-blue-600 hover:text-blue-700 mt-2 inline-block">
                                            View on LinkedIn →
                                        </a>
                                    )}

                                    {p.status === 'pending_review' && (
                                        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                            <button
                                                disabled={busy === p.id}
                                                onClick={() => act(p.id, 'approve')}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <CheckCircle2 className="h-3 w-3" /> Approve
                                            </button>
                                            <button
                                                disabled={busy === p.id}
                                                onClick={() => {
                                                    const when = prompt('Schedule for (ISO datetime, e.g. 2026-05-15T13:00:00-04:00):');
                                                    if (when) act(p.id, 'schedule', when);
                                                }}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <Calendar className="h-3 w-3" /> Schedule
                                            </button>
                                            <button
                                                disabled={busy === p.id}
                                                onClick={() => act(p.id, 'decline')}
                                                className="flex-1 inline-flex items-center justify-center gap-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                <XIcon className="h-3 w-3" /> Decline
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
