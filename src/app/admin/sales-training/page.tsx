'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Play, ChevronRight, X, ExternalLink,
  CheckCircle2, MessageCircle, ShieldQuestion, BookOpen, DollarSign, Clock, Users, GraduationCap, Target, Loader2, Eye, Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DEMO_CATALOG, DEMO_TRAINING_RESOURCES, type DemoIndustry } from '@/lib/demoCatalog';
import AdminNavbar from '@/components/AdminNavbar';

const ACCENT_DOT: Record<string, string> = {
  florist:    '#fb7185',
  dental:     '#22d3ee',
  brandhaven: '#fbbf24',
  manufacturing: '#94a3b8',
  accounting: '#60a5fa',
  retail:     '#84cc16',
};

export default function AdminSalesTrainingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [selectedKit, setSelectedKit] = useState<DemoIndustry | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/auth'); return; }
        const { data } = await supabase.from('profiles').select('is_admin').eq('id', session.user.id).single();
        setIsAdmin(((data as any)?.is_admin) === true);
      } finally {
        setLoading(false);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center text-slate-900">
        <div className="text-center">
          <p className="font-bold mb-2">Admin access required</p>
          <Link href="/admin" className="text-blue-600 hover:text-blue-700">Back to Admin</Link>
        </div>
      </div>
    );
  }

  const liveCount = DEMO_CATALOG.filter(d => d.available).length;
  const avgSavings = '$76k';
  const avgPayback = '3.4 mo';

  const openDemo = (path: string) => {
    window.open(path, '_blank', 'width=1500,height=950,noopener');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FE] text-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <AdminNavbar />

      <div className="max-w-screen-2xl mx-auto px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-blue-700 mb-4 transition">
            <ArrowLeft className="h-3.5 w-3.5" />
            Command Center
          </Link>

          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Sales Training Hub
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900">Train experts to sell AI agents.</h1>
              <p className="text-slate-600 text-sm mt-2 max-w-2xl">
                Click any industry to launch the live demo. Open the Sales Kit for ROI talking points, discovery questions, and objection handling.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={GraduationCap} tone="blue" label="Industries" value={DEMO_CATALOG.length.toString()} />
          <StatCard icon={Play} tone="emerald" label="Live Demos" value={liveCount.toString()} />
          <StatCard icon={DollarSign} tone="amber" label="Avg Annual Savings" value={avgSavings} />
          <StatCard icon={Clock} tone="violet" label="Avg Payback" value={avgPayback} />
        </div>

        {/* Demo Gallery */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-6 gap-3">
            <h2 className="text-2xl font-black tracking-tight text-slate-900">Industry Demos</h2>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              Click card → opens live demo · "Sales Kit" pill → talking points
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DEMO_CATALOG.map((demo, i) => (
              <motion.button
                key={demo.slug}
                type="button"
                onClick={() => demo.available ? openDemo(demo.demoPath) : setSelectedKit(demo)}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative text-left bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-100 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-900/20 transition-all duration-500 overflow-hidden"
              >
                {/* dotted background */}
                <div
                  className="absolute inset-0 opacity-[0.06] pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(circle at 2px 2px, ${ACCENT_DOT[demo.slug] || '#60a5fa'} 1px, transparent 0)`,
                    backgroundSize: '20px 20px',
                  }}
                />
                {/* glow */}
                <div
                  className="absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl opacity-[0.15] group-hover:opacity-30 transition-opacity"
                  style={{ background: ACCENT_DOT[demo.slug] || '#60a5fa' }}
                />

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="bg-slate-50 border border-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em]">
                      {demo.industry}
                    </span>
                    {demo.available ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Live
                      </span>
                    ) : (
                      <span className="bg-slate-50 text-slate-500 border border-slate-100 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                        Soon
                      </span>
                    )}
                  </div>

                  <h3 className="text-2xl font-black text-slate-900 leading-tight mb-1">{demo.persona}</h3>
                  <p className="text-[11px] font-bold text-slate-500 mb-4">{demo.location} · {demo.employees} employees</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-5 line-clamp-2">{demo.hero}</p>

                  <div className="grid grid-cols-2 gap-2 mb-5">
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Annual Savings</p>
                      <p className="text-lg font-black text-emerald-400">{demo.annualSavings}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Payback</p>
                      <p className="text-lg font-black text-slate-900">{demo.payback}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-slate-900 group-hover:text-blue-600 transition-colors">
                      {demo.available ? <Play className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      {demo.available ? 'Launch Demo' : 'View Kit'}
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.stopPropagation(); setSelectedKit(demo); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); setSelectedKit(demo); } }}
                      className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-blue-700 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-full px-3 py-1.5 cursor-pointer transition-colors"
                    >
                      Sales Kit
                      <ChevronRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </section>

        {/* Training Resources */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 md:p-8">
          <div className="flex items-end justify-between mb-6 gap-3">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-900">Training Resources</h2>
              <p className="text-xs text-slate-500 mt-1">Self-serve learning for sales reps and AI Experts.</p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">For experts</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEMO_TRAINING_RESOURCES.map((r, i) => (
              <div key={i} className="group bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 rounded-xl p-5 transition-all cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                </div>
                <h4 className="text-sm font-black text-slate-900 leading-tight mb-2">{r.title}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-4">{r.desc}</p>
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Clock className="h-3 w-3" />
                  {r.duration}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sales Kit Modal */}
      <AnimatePresence>
        {selectedKit && (
          <SalesKitModal demo={selectedKit} onClose={() => setSelectedKit(null)} onLaunch={() => openDemo(selectedKit.demoPath)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: 'blue' | 'emerald' | 'amber' | 'violet' }) {
  const t = {
    blue:    { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    text: 'text-blue-600'    },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
    amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   text: 'text-amber-400'   },
    violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  text: 'text-violet-400'  },
  }[tone];
  return (
    <div className="bg-white shadow-sm rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl ${t.bg} border ${t.border} flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${t.text}`} />
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-3xl font-black text-slate-900 tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function SalesKitModal({ demo, onClose, onLaunch }: { demo: DemoIndustry; onClose: () => void; onLaunch: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/70 backdrop-blur-md p-4 sm:p-8 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden my-8 border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-10 border-b border-slate-100">
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, ${ACCENT_DOT[demo.slug] || '#60a5fa'} 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />
          <button
            onClick={onClose}
            className="absolute top-6 right-6 h-10 w-10 rounded-full bg-slate-50 hover:bg-blue-100 text-slate-700 flex items-center justify-center transition"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="relative">
            <span className="bg-slate-50 border border-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.15em]">
              {demo.industry}
            </span>
            <h2 className="mt-5 text-3xl md:text-4xl font-black tracking-tight text-slate-900 leading-[1.05]">
              {demo.persona}
            </h2>
            <p className="mt-2 text-sm font-bold text-slate-600">{demo.location} · {demo.employees} employees</p>
            <p className="mt-5 max-w-2xl text-base text-slate-700 leading-relaxed">{demo.hero}</p>

            {demo.available && (
              <button
                onClick={onLaunch}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-6 py-3 text-sm font-black uppercase tracking-widest transition-colors shadow-lg"
              >
                <Play className="h-4 w-4" />
                Launch Live Demo
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="p-10 space-y-10">

          {/* ROI snapshot */}
          <section>
            <h3 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              ROI Snapshot
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <ROITile icon={DollarSign} label="Annual Savings" value={demo.annualSavings} />
              <ROITile icon={Clock} label="Payback" value={demo.payback} />
              <ROITile icon={Users} label="Agents in Package" value={demo.agents.length.toString()} />
              <ROITile icon={CheckCircle2} label="Time to Production" value="~30 days" />
            </div>
          </section>

          {/* Pain & Outcome */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-2">The pain they live with</p>
              <p className="text-sm text-slate-700 leading-relaxed">{demo.pain}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-2">What the agents deliver</p>
              <p className="text-sm text-slate-700 leading-relaxed">{demo.outcome}</p>
            </div>
          </section>

          {/* Agents */}
          <section>
            <h3 className="text-lg font-black text-slate-900 mb-4">Agents in this package</h3>
            <div className="flex flex-wrap gap-2">
              {demo.agents.map(a => (
                <span key={a} className="bg-blue-500/10 text-blue-700 border border-blue-500/20 px-3 py-1.5 rounded-full text-xs font-bold">
                  {a}
                </span>
              ))}
            </div>
          </section>

          {/* Discovery */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
              <MessageCircle className="h-4 w-4 text-cyan-400" />
              Discovery Questions
            </h3>
            <ol className="space-y-3 list-decimal list-inside">
              {demo.discoveryQuestions.map((q, i) => (
                <li key={i} className="text-sm text-slate-700 leading-relaxed pl-2">
                  {q}
                </li>
              ))}
            </ol>
          </section>

          {/* Talking points */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
              <Target className="h-4 w-4 text-emerald-400" />
              Talking Points
            </h3>
            <ul className="space-y-3">
              {demo.talkingPoints.map((tp, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-700 leading-relaxed">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{tp}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Objections */}
          <section>
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-900 mb-4">
              <ShieldQuestion className="h-4 w-4 text-amber-400" />
              Objection Handling
            </h3>
            <div className="space-y-3">
              {demo.objections.map((o, i) => (
                <div key={i} className="rounded-2xl bg-slate-50 border border-slate-100 p-5">
                  <p className="text-sm font-black text-slate-900 mb-2">"{o.q}"</p>
                  <p className="text-sm text-slate-600 leading-relaxed">→ {o.a}</p>
                </div>
              ))}
            </div>
          </section>

          {demo.available && (
            <section className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-700 mb-1">Next Step</p>
                <p className="text-base font-bold text-slate-900">Run the {demo.persona} demo before your next discovery call.</p>
              </div>
              <button
                onClick={onLaunch}
                className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm uppercase tracking-widest px-6 py-3 rounded-xl transition-colors shrink-0"
              >
                <Play className="h-4 w-4" />
                Launch Demo
              </button>
            </section>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ROITile({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
      <Icon className="h-4 w-4 text-blue-600 mb-2" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-black text-slate-900">{value}</p>
    </div>
  );
}
