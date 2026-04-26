
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Plus, Save, Trash2, Eye, EyeOff, Pencil, X, CheckCircle2, XCircle, Clock, Image } from 'lucide-react';
import { motion } from 'framer-motion';

interface BlogPost {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    content: string;
    cover_image: string | null;
    category: string;
    author: string;
    published: boolean;
    published_at: string | null;
    created_at: string;
}

interface BlogProposal {
    id: string;
    topic_title: string;
    description: string;
    suggested_image: string | null;
    queue_position: number | null;
    status: 'pending' | 'approved' | 'rejected';
    proposed_at: string;
    reviewed_at: string | null;
}

const CATEGORIES = ['Agentic AI', 'Strategy', 'Automation', 'Case Study', 'Industry Insights'];

const slugify = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const BlogAdmin: React.FC = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [proposals, setProposals] = useState<BlogProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [proposalsLoading, setProposalsLoading] = useState(true);
    const [editing, setEditing] = useState<BlogPost | null>(null);
    const [creating, setCreating] = useState(false);
    const [saving, setSaving] = useState(false);
    const [reviewingId, setReviewingId] = useState<string | null>(null);

    const [form, setForm] = useState({
        title: '', slug: '', excerpt: '', content: '', cover_image: '', category: 'Agentic AI', author: 'Audcomp', published: false,
    });

    const fetchPosts = useCallback(async () => {
        if (!supabase) return;
        setLoading(true);
        const { data } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });
        if (data) setPosts(data);
        setLoading(false);
    }, []);

    const fetchProposals = useCallback(async () => {
        if (!supabase) return;
        setProposalsLoading(true);
        const { data } = await supabase
            .from('blog_proposals')
            .select('*')
            .order('proposed_at', { ascending: false });
        if (data) setProposals(data as BlogProposal[]);
        setProposalsLoading(false);
    }, []);

    useEffect(() => { fetchPosts(); fetchProposals(); }, [fetchPosts, fetchProposals]);

    const resetForm = () => {
        setForm({ title: '', slug: '', excerpt: '', content: '', cover_image: '', category: 'Agentic AI', author: 'Audcomp', published: false });
        setEditing(null);
        setCreating(false);
    };

    const openCreate = () => { resetForm(); setCreating(true); };

    const openEdit = (post: BlogPost) => {
        setForm({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            cover_image: post.cover_image || '',
            category: post.category,
            author: post.author,
            published: post.published,
        });
        setEditing(post);
        setCreating(true);
    };

    const handleSave = async () => {
        if (!supabase || !form.title || !form.excerpt || !form.content) return;
        setSaving(true);
        const slug = form.slug || slugify(form.title);
        const payload = {
            title: form.title, slug, excerpt: form.excerpt, content: form.content,
            cover_image: form.cover_image || null, category: form.category, author: form.author,
            published: form.published,
            published_at: form.published ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        };
        if (editing) {
            await supabase.from('blog_posts').update(payload).eq('id', editing.id);
        } else {
            await supabase.from('blog_posts').insert(payload);
        }
        resetForm();
        setSaving(false);
        fetchPosts();
    };

    const handleDelete = async (id: string) => {
        if (!supabase || !confirm('Delete this post permanently?')) return;
        await supabase.from('blog_posts').delete().eq('id', id);
        fetchPosts();
    };

    const togglePublish = async (post: BlogPost) => {
        if (!supabase) return;
        const published = !post.published;
        await supabase.from('blog_posts').update({
            published,
            published_at: published ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
        }).eq('id', post.id);
        fetchPosts();
    };

    const handleApprove = async (proposal: BlogProposal) => {
        if (!supabase) return;
        setReviewingId(proposal.id);
        // Create a draft blog post from the proposal
        const slug = slugify(proposal.topic_title);
        await supabase.from('blog_posts').insert({
            title: proposal.topic_title,
            slug,
            excerpt: proposal.description,
            content: '<p>Content coming soon.</p>',
            cover_image: proposal.suggested_image ? `/images/${proposal.suggested_image}` : null,
            category: 'Agentic AI',
            author: 'Audcomp',
            published: false,
            updated_at: new Date().toISOString(),
        });
        // Mark proposal approved
        await supabase.from('blog_proposals').update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
        }).eq('id', proposal.id);
        setReviewingId(null);
        fetchProposals();
        fetchPosts();
    };

    const handleReject = async (proposal: BlogProposal) => {
        if (!supabase) return;
        setReviewingId(proposal.id);
        await supabase.from('blog_proposals').update({
            status: 'rejected',
            reviewed_at: new Date().toISOString(),
        }).eq('id', proposal.id);
        setReviewingId(null);
        fetchProposals();
    };

    const pendingProposals = proposals.filter(p => p.status === 'pending');
    const reviewedProposals = proposals.filter(p => p.status !== 'pending');

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-8">

            {/* ── Proposals Section ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-black text-white">Topic Proposals</h2>
                        {pendingProposals.length > 0 && (
                            <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                {pendingProposals.length} pending
                            </span>
                        )}
                    </div>
                </div>

                {proposalsLoading ? (
                    <div className="flex items-center justify-center h-24"><Loader2 className="h-5 w-5 text-blue-500 animate-spin" /></div>
                ) : proposals.length === 0 ? (
                    <div className="text-center py-10 text-slate-500 text-sm font-medium backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5">
                        No proposals yet. Run the blog scheduler to propose the next topic.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Pending first */}
                        {pendingProposals.map(proposal => (
                            <div key={proposal.id} className="backdrop-blur-xl bg-slate-900/60 rounded-2xl border border-amber-500/20 p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Awaiting Approval</span>
                                            {proposal.queue_position && (
                                                <span className="text-[10px] font-bold text-slate-500">· Queue #{proposal.queue_position}</span>
                                            )}
                                        </div>
                                        <h3 className="text-base font-black text-white mb-2">{proposal.topic_title}</h3>
                                        <p className="text-sm text-slate-400 font-medium leading-relaxed mb-3">{proposal.description}</p>
                                        {proposal.suggested_image && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
                                                <Image className="h-3 w-3" />
                                                /images/{proposal.suggested_image}
                                            </div>
                                        )}
                                        <div className="text-xs text-slate-600 font-medium mt-2">Proposed {formatDate(proposal.proposed_at)}</div>
                                    </div>
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => handleApprove(proposal)}
                                            disabled={reviewingId === proposal.id}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all disabled:opacity-40"
                                        >
                                            {reviewingId === proposal.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(proposal)}
                                            disabled={reviewingId === proposal.id}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/10 rounded-xl text-xs font-black transition-all disabled:opacity-40"
                                        >
                                            {reviewingId === proposal.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Reviewed (collapsed history) */}
                        {reviewedProposals.length > 0 && (
                            <details className="group">
                                <summary className="text-xs font-bold text-slate-500 cursor-pointer hover:text-slate-300 transition-colors py-1 list-none flex items-center gap-1.5">
                                    <span className="group-open:rotate-90 transition-transform inline-block">›</span>
                                    {reviewedProposals.length} reviewed proposal{reviewedProposals.length !== 1 ? 's' : ''}
                                </summary>
                                <div className="mt-2 space-y-2">
                                    {reviewedProposals.map(proposal => (
                                        <div key={proposal.id} className="backdrop-blur-xl bg-slate-900/30 rounded-xl border border-white/5 px-5 py-3 flex items-center justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-400 truncate">{proposal.topic_title}</p>
                                                {proposal.reviewed_at && (
                                                    <p className="text-xs text-slate-600 mt-0.5">{formatDate(proposal.reviewed_at)}</p>
                                                )}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${proposal.status === 'approved' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                {proposal.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        )}
                    </div>
                )}
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-white/5" />

            {/* ── Blog Posts Section ── */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black text-white">Blog Posts ({posts.length})</h2>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all"
                    >
                        <Plus className="h-4 w-4" /> New Post
                    </button>
                </div>

                {/* Create / Edit Form */}
                {creating && (
                    <div className="backdrop-blur-xl bg-slate-900/60 rounded-2xl border border-white/10 p-6 space-y-4 mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-black text-white uppercase tracking-widest">{editing ? 'Edit Post' : 'New Post'}</h3>
                            <button onClick={resetForm} className="text-slate-500 hover:text-white"><X className="h-4 w-4" /></button>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Title</label>
                                <input
                                    value={form.title}
                                    onChange={e => { setForm(f => ({ ...f, title: e.target.value, slug: editing ? f.slug : slugify(e.target.value) })); }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-blue-500 focus:outline-none"
                                    placeholder="Article title..."
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Slug</label>
                                <input
                                    value={form.slug}
                                    onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium font-mono focus:border-blue-500 focus:outline-none"
                                    placeholder="url-friendly-slug"
                                />
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Category</label>
                                <select
                                    value={form.category}
                                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-blue-500 focus:outline-none"
                                >
                                    {CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-900">{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Author</label>
                                <input
                                    value={form.author}
                                    onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-blue-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cover Image URL</label>
                                <input
                                    value={form.cover_image}
                                    onChange={e => setForm(f => ({ ...f, cover_image: e.target.value }))}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-blue-500 focus:outline-none"
                                    placeholder="https://... or /images/blog_xxx.png"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Excerpt</label>
                            <textarea
                                value={form.excerpt}
                                onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
                                rows={2}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-medium focus:border-blue-500 focus:outline-none resize-none"
                                placeholder="Short description for listing cards..."
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Content (HTML)</label>
                            <textarea
                                value={form.content}
                                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                                rows={12}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-blue-500 focus:outline-none resize-y"
                                placeholder="<h2>Section Title</h2><p>Content here...</p>"
                            />
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.published}
                                    onChange={e => setForm(f => ({ ...f, published: e.target.checked }))}
                                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500/50"
                                />
                                <span className="text-sm font-bold text-slate-300">Publish immediately</span>
                            </label>
                            <button
                                onClick={handleSave}
                                disabled={saving || !form.title || !form.content}
                                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 transition-all disabled:opacity-40"
                            >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {editing ? 'Update' : 'Save'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Posts List */}
                {loading ? (
                    <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 text-blue-500 animate-spin" /></div>
                ) : posts.length === 0 ? (
                    <div className="text-center py-16 text-slate-500 text-sm font-medium">No blog posts yet. Click "New Post" to create your first article.</div>
                ) : (
                    <div className="backdrop-blur-xl bg-slate-900/40 rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 bg-white/5">
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Title</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Category</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-4 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                                    <th className="px-4 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {posts.map(post => (
                                    <tr key={post.id} className="hover:bg-white/2 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white text-sm">{post.title}</div>
                                            <div className="text-slate-500 text-xs font-mono mt-0.5">/blog/{post.slug}</div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-xs font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">{post.category}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={`text-xs font-black uppercase tracking-widest ${post.published ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                {post.published ? 'Published' : 'Draft'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-xs text-slate-500 font-medium">
                                            {new Date(post.published_at || post.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => togglePublish(post)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors" title={post.published ? 'Unpublish' : 'Publish'}>
                                                    {post.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                                <button onClick={() => openEdit(post)} className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors" title="Edit">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                                <button onClick={() => handleDelete(post.id)} className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="Delete">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default BlogAdmin;

