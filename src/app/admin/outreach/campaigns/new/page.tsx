'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewCampaignPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [amsClients, setAmsClients] = useState<any[]>([]);

    const [name, setName] = useState('');
    const [amsClientId, setAmsClientId] = useState('');
    const [status, setStatus] = useState('draft');

    useEffect(() => {
        async function load() {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/auth'); return; }

            const { data: profileData } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', session.user.id)
                .single() as any;

            if (!profileData?.is_admin) { router.push('/admin'); return; }

            const { data } = await supabase
                .from('ams_clients')
                .select('id, company_name')
                .eq('status', 'active')
                .order('company_name') as any;

            setAmsClients(data || []);
            setLoading(false);
        }
        load();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) { setError('Campaign name is required.'); return; }

        setSubmitting(true);
        setError(null);

        const res = await fetch('/api/outreach/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: name.trim(),
                ams_client_id: amsClientId || null,
                status,
            }),
        });

        const json = await res.json();
        setSubmitting(false);

        if (!res.ok) {
            setError(json.error || 'Failed to create campaign.');
        } else {
            router.push(`/admin/outreach/campaigns/${json.id}/settings`);
        }
    };

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <AdminNavbar />
            <main className="pl-64 pr-10 pt-10 pb-20">
                <header className="flex items-center gap-4 mb-10">
                    <Link href="/admin/outreach/campaigns"
                        className="h-10 w-10 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 shadow-sm transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">New Campaign</h1>
                        <p className="text-slate-400 font-medium text-sm mt-0.5">Start a new AI outreach campaign</p>
                    </div>
                </header>

                <div className="max-w-xl">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8">
                        {error && (
                            <div className="mb-6 px-5 py-4 rounded-2xl bg-red-50 border border-red-100 text-red-700 font-bold text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    Campaign Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Ontario Manufacturing Q2 2026"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-300"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
                                    AMS Client (optional)
                                </label>
                                <p className="text-[10px] text-slate-400 font-medium mb-2">Link this campaign to a managed services client</p>
                                <select
                                    value={amsClientId}
                                    onChange={e => setAmsClientId(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">— No client linked —</option>
                                    {amsClients.map(c => (
                                        <option key={c.id} value={c.id}>{c.company_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Status</label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="draft">Draft — set up before activating</option>
                                    <option value="active">Active — agents can start immediately</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="submit" disabled={submitting}
                                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl font-black text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50">
                                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {submitting ? 'Creating...' : 'Create Campaign →'}
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium text-center">
                                You'll be taken to settings to configure ICP and email templates.
                            </p>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
