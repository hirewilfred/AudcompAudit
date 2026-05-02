'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight, ArrowUpRight, Loader2, LogOut, Play, GraduationCap, Users, ClipboardList,
  TrendingUp, Mail, ExternalLink, Sparkles, ChevronRight, Phone, Search, Filter,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DEMO_CATALOG } from '@/lib/demoCatalog';

interface AssignedClient {
  id: string;
  full_name: string | null;
  email: string | null;
  organization: string | null;
  phone: string | null;
  has_completed_audit: boolean | null;
  updated_at: string | null;
  overall_score: number | null;
  audit_created_at: string | null;
}

const ACCENT_DOT: Record<string, string> = {
  florist:    '#fb7185',
  dental:     '#22d3ee',
  brandhaven: '#fbbf24',
  manufacturing: '#94a3b8',
  accounting: '#60a5fa',
  retail:     '#84cc16',
};

export default function ExpertDashboardPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [expert, setExpert] = useState<{ id: string; full_name: string; email: string; photo_url?: string | null; bookings_url?: string | null; linkedin_url?: string | null } | null>(null);
  const [clients, setClients] = useState<AssignedClient[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/auth'); return; }

        const { data: expertRow } = await supabase
          .from('experts')
          .select('id, full_name, email, photo_url, bookings_url, linkedin_url')
          .eq('email', session.user.email ?? '')
          .maybeSingle() as any;

        if (!expertRow?.id) {
          router.push('/dashboard');
          return;
        }
        setExpert(expertRow);

        // Pull clients assigned to this expert
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, email, organization, phone, has_completed_audit, updated_at')
          .eq('assigned_expert_id', expertRow.id)
          .order('updated_at', { ascending: false }) as any;

        const clientList = (profilesData || []) as any[];
        const userIds = clientList.map(c => c.id);

        // Pull latest audit score per client
        let scoreMap = new Map<string, { overall: number | null; created_at: string | null }>();
        if (userIds.length) {
          const { data: scores } = await supabase
            .from('audit_scores')
            .select('user_id, overall_score, created_at')
            .in('user_id', userIds)
            .order('created_at', { ascending: false }) as any;
          for (const s of (scores || [])) {
            if (!scoreMap.has(s.user_id)) {
              scoreMap.set(s.user_id, { overall: s.overall_score, created_at: s.created_at });
            }
          }
        }

        setClients(clientList.map(c => ({
          id: c.id,
          full_name: c.full_name,
          email: c.email,
          organization: c.organization,
          phone: c.phone,
          has_completed_audit: c.has_completed_audit,
          updated_at: c.updated_at,
          overall_score: scoreMap.get(c.id)?.overall ?? null,
          audit_created_at: scoreMap.get(c.id)?.created_at ?? null,
        })));
      } catch (err) {
        console.error('expert dashboard load failed', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      if (filter === 'completed' && !c.has_completed_audit) return false;
      if (filter === 'pending' && c.has_completed_audit) return false;
      if (search) {
        const q = search.toLowerCase();
        return (c.full_name || '').toLowerCase().includes(q)
          || (c.organization || '').toLowerCase().includes(q)
          || (c.email || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [clients, search, filter]);

  const stats = useMemo(() => {
    const total = clients.length;
    const completed = clients.filter(c => c.has_completed_audit).length;
    const avgScore = (() => {
      const scored = clients.filter(c => typeof c.overall_score === 'number');
      if (!scored.length) return null;
      return Math.round(scored.reduce((s, c) => s + (c.overall_score || 0), 0) / scored.length);
    })();
    const last7 = clients.filter(c => {
      if (!c.audit_created_at) return false;
      return Date.now() - new Date(c.audit_created_at).getTime() < 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total, completed, avgScore, last7 };
  }, [clients]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080f1e] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!expert) return null;

  return (
    <div className="min-h-screen bg-[#080f1e] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#080f1e]/95 backdrop-blur border-b border-white/5">
        <div className="max-w-screen-2xl mx-auto px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {expert.photo_url ? (
              <img src={expert.photo_url} alt={expert.full_name} className="h-11 w-11 rounded-2xl object-cover border border-white/10" />
            ) : (
              <div className="h-11 w-11 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-black">
                {expert.full_name?.charAt(0) || 'E'}
              </div>
            )}
            <div>
              <div className="font-black text-lg">{expert.full_name}</div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                Audcomp AI Expert · Portal
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {expert.bookings_url && (
              <a
                href={expert.bookings_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
              >
                My Bookings
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-white/5 hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 text-slate-300 hover:text-rose-300 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-8 py-8 space-y-10">

        {/* WELCOME */}
        <section>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
            Welcome back, {expert.full_name?.split(' ')[0]}.
          </h1>
          <p className="text-slate-400 text-base mt-2 max-w-2xl">
            Your assigned customers, their audit scores, and the sales-training resources you need to close them — all in one place.
          </p>
        </section>

        {/* STATS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Users}        tone="blue"    label="Assigned Customers" value={stats.total.toString()} sub={`${stats.completed} have completed an audit`} />
          <StatCard icon={ClipboardList} tone="emerald" label="Completed Audits"   value={stats.completed.toString()} sub={`${stats.total - stats.completed} pending`} />
          <StatCard icon={TrendingUp}    tone="amber"   label="Avg Readiness"      value={stats.avgScore !== null ? `${stats.avgScore}%` : '—'} sub="across your audited clients" />
          <StatCard icon={Sparkles}      tone="violet"  label="Audits Last 7 Days" value={stats.last7.toString()} sub="recently scored" />
        </section>

        {/* SALES TRAINING — link strip */}
        <section className="bg-[#0d1629] rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <div className="font-black text-white">Sales Training Hub</div>
                <div className="text-[11px] text-slate-500">{DEMO_CATALOG.length} industry demos · ROI talking points · objection handling</div>
              </div>
            </div>
            <Link
              href="/admin/sales-training"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-black uppercase tracking-widest transition-colors"
            >
              Open Full Hub
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEMO_CATALOG.slice(0, 6).map((d) => (
              <button
                key={d.slug}
                onClick={() => d.available
                  ? window.open(d.demoPath, '_blank', 'width=1500,height=950')
                  : router.push('/admin/sales-training')
                }
                className="group relative text-left bg-white/3 hover:bg-white/8 border border-white/5 hover:border-white/15 rounded-xl p-4 transition-all overflow-hidden"
              >
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${ACCENT_DOT[d.slug] || '#60a5fa'} 1px, transparent 0)`,
                    backgroundSize: '20px 20px',
                  }}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">{d.industry}</span>
                    {d.available ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                        <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    ) : (
                      <span className="bg-white/5 text-slate-500 border border-white/10 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                        Soon
                      </span>
                    )}
                  </div>
                  <div className="font-black text-sm text-white leading-tight mb-1">{d.persona}</div>
                  <div className="text-[10px] text-slate-500 mb-3">{d.location}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-emerald-400">{d.annualSavings}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-blue-400 transition-colors">
                      {d.available ? <Play className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      {d.available ? 'Launch' : 'View'}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* MY CUSTOMERS */}
        <section className="bg-[#0d1629] rounded-2xl border border-white/5 overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <Users className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <div className="font-black text-white">My Customers</div>
                <div className="text-[11px] text-slate-500">Everyone you've been assigned · {filteredClients.length} of {clients.length} shown</div>
              </div>
            </div>

            {/* search + filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search name, company, email"
                  className="w-64 bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white placeholder:text-slate-500 outline-none focus:border-blue-500/40"
                />
              </div>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                {(['all', 'completed', 'pending'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                      filter === f ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-10 w-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-bold">No customers assigned yet.</p>
              <p className="text-slate-500 text-xs mt-1">When admins assign customers to you, they'll show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/3 border-b border-white/5">
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Organization</th>
                    <th className="px-6 py-3">Audit Score</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Last Activity</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="font-black text-white text-sm">{c.full_name || '—'}</div>
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="text-[11px] text-slate-500 hover:text-blue-400 inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {c.email}
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-300">{c.organization || '—'}</div>
                        {c.phone && (
                          <a href={`tel:${c.phone}`} className="text-[11px] text-slate-500 hover:text-blue-400 inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {c.phone}
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {typeof c.overall_score === 'number' ? (
                          <ScoreBadge score={c.overall_score} />
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">no audit</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {c.has_completed_audit ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-slate-400">
                          {c.audit_created_at ? new Date(c.audit_created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : (c.updated_at ? new Date(c.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/admin/audits?user=${c.id}`}
                          className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-blue-400 transition-colors"
                        >
                          View
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub: string; tone: 'blue' | 'emerald' | 'amber' | 'violet' }) {
  const t = {
    blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-400'    },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400'   },
    violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  text: 'text-violet-400'  },
  }[tone];
  return (
    <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-5 border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`h-10 w-10 rounded-xl ${t.bg} border ${t.border} flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${t.text}`} />
        </div>
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-3xl font-black text-white tabular-nums">{value}</p>
      <p className="text-[11px] text-slate-500 mt-1">{sub}</p>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 75 ? 'emerald' : score >= 50 ? 'amber' : 'rose';
  const cls = {
    emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber:   'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose:    'bg-rose-500/15 text-rose-300 border-rose-500/30',
  }[tone];
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border tabular-nums ${cls}`}>
      {score}%
    </span>
  );
}
