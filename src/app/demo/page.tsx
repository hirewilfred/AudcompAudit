'use client';
import { useEffect, useState } from 'react';
import {
  Play, Pause, Flower2, X, TrendingUp, Activity, Eye,
  Bot, CalendarDays, Heart, MessageCircle, Send, CheckCircle2, Clock,
  Instagram, Facebook, Youtube, Globe, Music2,
} from 'lucide-react';
import {
  DEMO_AGENTS, DEMO_IMPACT, DEMO_PERSONA, DEMO_KPIS,
  DEMO_CAMPAIGNS, DEMO_EVENTS, DEMO_QUEUED_POSTS,
  buildInitialActivity, makeActivityEntry,
} from '@/lib/demoData';

const RATE = 24;

const PLATFORM_META: Record<string, { icon: any; color: string; label: string }> = {
  instagram: { icon: Instagram, color: 'text-pink-400',   label: 'Instagram' },
  facebook:  { icon: Facebook,  color: 'text-blue-400',   label: 'Facebook'  },
  tiktok:    { icon: Music2,    color: 'text-white',      label: 'TikTok'    },
  youtube:   { icon: Youtube,   color: 'text-red-400',    label: 'YouTube'   },
  google:    { icon: Globe,     color: 'text-emerald-400',label: 'Google'    },
  twitter:   { icon: Send,      color: 'text-sky-400',    label: 'X'         },
};

export default function DemoPage() {
  const [running, setRunning] = useState(false);
  const [ops, setOps] = useState({ tokens: 4_245_864, hours: 22.76, cost: 546.45, tasks: 67 });
  const [activity, setActivity] = useState(buildInitialActivity(8));

  useEffect(() => {
    if (!running) return;
    let seed = 8;
    const a = setInterval(() => {
      setActivity(prev => [makeActivityEntry(seed++, Date.now()), ...prev].slice(0, 10));
      setOps(p => {
        const tb = 2000 + Math.floor(Math.random() * 3000);
        const hb = (1 + Math.random() * 2) / 60;
        return {
          tokens: p.tokens + tb,
          hours:  +(p.hours + hb).toFixed(2),
          cost:   +(p.cost + hb * RATE).toFixed(2),
          tasks:  p.tasks + 1,
        };
      });
    }, 3500);
    const t = setInterval(() => setOps(p => ({ ...p, tokens: p.tokens + 120 + Math.floor(Math.random() * 300) })), 900);
    return () => { clearInterval(a); clearInterval(t); };
  }, [running]);

  const liveAgents = DEMO_AGENTS.filter(x => x.status === 'running').slice(0, 6);
  const offAgents = DEMO_AGENTS.filter(x => x.status !== 'running').slice(0, 6);
  const totalAgents = DEMO_AGENTS.length;
  const humanCost = 6346;
  const saved = Math.max(0, Math.round((1 - ops.cost / humanCost) * 100));
  const readyToPublish = DEMO_QUEUED_POSTS.filter(p => p.readyToPublish);
  const upcomingPosts = DEMO_QUEUED_POSTS.filter(p => !p.readyToPublish);

  return (
    <div className="min-h-screen bg-[#080f1e] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#080f1e]/95 backdrop-blur border-b border-white/5 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
            <Flower2 className="h-4 w-4 text-rose-400" />
          </div>
          <div>
            <div className="font-black text-sm">{DEMO_PERSONA.businessName}</div>
            <div className="text-[10px] text-slate-500">{DEMO_PERSONA.tagline}</div>
          </div>
          <span className="ml-2 text-[9px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full">
            Business OS · Live Demo
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {DEMO_PERSONA.nextHoliday.name} in <strong className="text-rose-400">{DEMO_PERSONA.nextHoliday.daysOut} days</strong>
          </span>
          <button
            onClick={() => setRunning(r => !r)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${running ? 'bg-rose-600 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
          >
            {running ? <><Pause className="h-3.5 w-3.5" />Stop</> : <><Play className="h-3.5 w-3.5" />Start Demo</>}
          </button>
          <button onClick={() => window.close()} className="p-1.5 rounded-lg text-slate-600 hover:text-white hover:bg-white/5">
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="px-8 py-6 space-y-4 max-w-screen-2xl mx-auto">

        {/* ── AGENTS — LIVE + IDLE ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-300">Agents Running Now</span>
            </div>
            <span className="text-xs text-slate-500">{liveAgents.length} of {totalAgents} active</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {liveAgents.map(agent => (
              <div key={agent.name} className="bg-[#0d1629] rounded-xl border border-emerald-500/20 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live</span>
                </div>
                <div className="font-black text-white text-sm mb-1 leading-tight">{agent.label}</div>
                <div className="text-[10px] text-slate-400 mb-3 leading-relaxed">{agent.outcomeMetric}</div>
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-1 rounded-lg text-center">
                  saves {agent.weeklyHoursSaved}h/wk
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3 mt-5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span className="text-xs font-black uppercase tracking-widest text-slate-400">Standing By · Idle &amp; Queued</span>
            </div>
            <span className="text-xs text-slate-600">spin up on trigger — no idle cost</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {offAgents.map(agent => {
              const isQueued = agent.status === 'queued';
              return (
                <div key={agent.name} className="bg-[#0a1322] rounded-xl border border-white/5 p-3 opacity-90">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${isQueued ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isQueued ? 'text-amber-400' : 'text-slate-500'}`}>
                      {isQueued ? 'Queued' : 'Idle'}
                    </span>
                  </div>
                  <div className="font-black text-slate-200 text-sm mb-1 leading-tight">{agent.label}</div>
                  <div className="text-[10px] text-slate-500 mb-3 leading-relaxed">{agent.outcomeMetric}</div>
                  <div className="bg-white/5 border border-white/5 text-slate-400 text-[10px] font-black px-2 py-1 rounded-lg text-center">
                    saves {agent.weeklyHoursSaved}h/wk
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── LIVE ACTIVITY FEED ── */}
        <section className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-cyan-400" />
              </div>
              <div>
                <div className="font-black text-white">Live Activity Feed</div>
                <div className="text-[11px] text-slate-500">Every action the agents take, streamed in real time.</div>
              </div>
            </div>
            {running && <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">● live</span>}
          </div>
          <div className="space-y-1.5 max-h-[280px] overflow-hidden">
            {activity.map(a => (
              <div key={a.id} className="flex items-start gap-3 text-xs py-1.5 border-b border-white/5 last:border-0">
                <span className={`shrink-0 mt-0.5 ${a.status === 'succeeded' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {a.status === 'succeeded' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                </span>
                <span className="text-slate-500 font-mono text-[10px] uppercase tracking-widest shrink-0 w-44 truncate">{a.agent_name}</span>
                <span className="text-slate-300 flex-1">{a.task}</span>
              </div>
            ))}
          </div>
          {!running && (
            <div className="mt-3 pt-3 border-t border-white/5 text-center">
              <span className="text-[11px] text-slate-500">Press <strong className="text-emerald-400">Start Demo</strong> in the header to watch the feed update in real time.</span>
            </div>
          )}
        </section>

        {/* ── IMPACT ── */}
        <section className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="font-black text-white">Impact — what this would cost in human hours</div>
              <div className="text-[11px] text-slate-500">Estimated against a blended social-marketer rate of ${DEMO_IMPACT.hourlyRate}/hr CAD.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'HOURS / WEEK SAVED',      value: `${DEMO_IMPACT.weeklyHoursSaved} hrs`,                                  sub: `across all ${totalAgents} sub-agents`,        color: 'text-emerald-400' },
              { label: 'FULL-TIME ROLES REPLACED',value: `${DEMO_IMPACT.fteEquivalent} FTE`,                                     sub: 'at 40 hrs/wk per role',                       color: 'text-white'       },
              { label: 'ANNUAL HOURS SAVED',      value: `${DEMO_IMPACT.annualHoursSaved.toLocaleString()} hrs`,                 sub: '52-week projection',                          color: 'text-white'       },
              { label: 'ANNUAL COST SAVED',       value: `$${(DEMO_IMPACT.annualCostSaved / 1000).toFixed(1)}k CAD`,             sub: 'vs. hiring a marketing team',                 color: 'text-emerald-400' },
            ].map(k => (
              <div key={k.label} className="border-l-2 border-white/5 pl-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{k.label}</div>
                <div className={`text-3xl font-black ${k.color}`}>{k.value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── LIVE OPERATING COST ── */}
        <section className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-white">Live Operating Cost</span>
                {running && (
                  <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">
                    ● ticking
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                Agents only run when triggered — ${RATE}/hr while active. No idle cost, no salary, no benefits.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label: 'TOKENS THIS MONTH', value: `${(ops.tokens / 1_000_000).toFixed(2)} M`,                                       sub: `${ops.tokens.toLocaleString()} total`,                                color: 'text-white'       },
              { label: 'ACTIVE RUNTIME',    value: `${ops.hours} hrs`,                                                               sub: 'this month — only when running',                                      color: 'text-white'       },
              { label: 'COST THIS MONTH',   value: `$${ops.cost.toLocaleString('en-CA', { minimumFractionDigits: 2 })}`,             sub: `at $${RATE}/hr · ${ops.tasks.toLocaleString()} tasks today`,          color: 'text-white'       },
              { label: 'VS. HUMAN TEAM',    value: `${saved}% saved`,                                                                sub: `$${humanCost.toLocaleString()}/mo human cost`,                        color: 'text-emerald-400' },
            ].map(k => (
              <div key={k.label} className="border-l-2 border-white/5 pl-4">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{k.label}</div>
                <div className={`text-3xl font-black ${k.color}`}>{k.value}</div>
                <div className="text-[10px] text-slate-600 mt-0.5">{k.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── KPI TILE ROW ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Bot,           value: DEMO_KPIS.activeAgents,                            label: 'Active Agents',     sub: `${DEMO_KPIS.agentRunsToday} runs today`,         tile: 'bg-rose-500/10 border-rose-500/20',    iconColor: 'text-rose-400'    },
            { icon: CalendarDays,  value: DEMO_KPIS.postsQueued,                             label: 'Posts Queued',      sub: `${readyToPublish.length} ready to publish`,      tile: 'bg-violet-500/10 border-violet-500/20',iconColor: 'text-violet-400'  },
            { icon: TrendingUp,    value: `${(DEMO_KPIS.weeklyReach / 1000).toFixed(1)}k`,   label: 'Weekly Reach',      sub: `${DEMO_KPIS.engagementRate}% engagement`,        tile: 'bg-emerald-500/10 border-emerald-500/20',iconColor: 'text-emerald-400'},
            { icon: Heart,         value: DEMO_KPIS.eventsThisWeek,                          label: 'Events This Week',  sub: `${DEMO_KPIS.liveCampaigns} live campaigns`,      tile: 'bg-amber-500/10 border-amber-500/20',  iconColor: 'text-amber-400'   },
          ].map((k, i) => (
            <div key={i} className="bg-[#0d1629] rounded-2xl border border-white/5 p-4">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-3 ${k.tile}`}>
                <k.icon className={`h-5 w-5 ${k.iconColor}`} />
              </div>
              <div className="text-3xl font-black text-white">{k.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">{k.label}</div>
              <div className="text-[10px] text-slate-600 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </section>

        {/* ── LIVE CAMPAIGNS ── */}
        <section className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
              </div>
              <div>
                <div className="font-black text-white">Live Campaigns</div>
                <div className="text-[11px] text-slate-500">Multi-channel pushes the agents are running right now.</div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {DEMO_CAMPAIGNS.filter(c => c.status === 'live').length} live · {DEMO_CAMPAIGNS.filter(c => c.status === 'queued').length} queued
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {DEMO_CAMPAIGNS.slice(0, 4).map(c => (
              <div key={c.id} className="bg-[#111e36] rounded-xl border border-white/5 overflow-hidden">
                <div className="relative h-28">
                  <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${c.accent} opacity-60`} />
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${c.status === 'live' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-700/60 text-slate-300 border border-white/10'}`}>
                      {c.status === 'live' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />}
                      {c.status}
                    </span>
                  </div>
                </div>
                <div className="p-3">
                  <div className="font-black text-sm text-white mb-1 leading-tight">{c.name}</div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {c.channels.map(ch => (
                      <span key={ch} className="text-[9px] font-bold text-slate-400 bg-white/5 px-1.5 py-0.5 rounded">{ch}</span>
                    ))}
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span>{c.posted} of {c.posts} posts</span>
                      <span>{c.progress}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${c.accent}`} style={{ width: `${c.progress}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Reach</div>
                      <div className="text-xs font-black text-white">{c.metrics.reach >= 1000 ? `${(c.metrics.reach / 1000).toFixed(1)}k` : c.metrics.reach}</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eng</div>
                      <div className="text-xs font-black text-white">{c.metrics.engagement}%</div>
                    </div>
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Saves</div>
                      <div className="text-xs font-black text-white">{c.metrics.saves >= 1000 ? `${(c.metrics.saves / 1000).toFixed(1)}k` : c.metrics.saves}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── READY TO PUBLISH + QUEUE ── */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">

          {/* Ready to publish */}
          <div className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="font-black text-white">Ready to Publish</div>
                  <div className="text-[11px] text-slate-500">Approved drafts the Scheduler will push next.</div>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                {readyToPublish.length} ready
              </span>
            </div>
            <div className="space-y-2">
              {readyToPublish.map(p => {
                const meta = PLATFORM_META[p.platform];
                const Icon = meta?.icon ?? Globe;
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-[#111e36] rounded-xl border border-white/5 p-2.5">
                    <img src={p.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className={`h-3 w-3 ${meta?.color ?? 'text-slate-400'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{meta?.label ?? p.platform}</span>
                        <span className="text-[9px] text-slate-600">·</span>
                        <span className="text-[9px] text-slate-500">{p.scheduledFor}</span>
                      </div>
                      <div className="text-xs text-white leading-snug truncate">{p.title}</div>
                    </div>
                    <button className="shrink-0 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg">
                      Publish
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming queue */}
          <div className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-violet-400" />
                </div>
                <div>
                  <div className="font-black text-white">Upcoming Queue</div>
                  <div className="text-[11px] text-slate-500">Scheduled posts the agents are still polishing.</div>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{upcomingPosts.length} scheduled</span>
            </div>
            <div className="space-y-2">
              {upcomingPosts.map(p => {
                const meta = PLATFORM_META[p.platform];
                const Icon = meta?.icon ?? Globe;
                return (
                  <div key={p.id} className="flex items-center gap-3 bg-[#111e36] rounded-xl border border-white/5 p-2.5">
                    <img src={p.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className={`h-3 w-3 ${meta?.color ?? 'text-slate-400'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{meta?.label ?? p.platform}</span>
                        <span className="text-[9px] text-slate-600">·</span>
                        <span className="text-[9px] text-slate-500">{p.scheduledFor}</span>
                      </div>
                      <div className="text-xs text-white leading-snug truncate">{p.title}</div>
                    </div>
                    <span className="shrink-0 text-[9px] font-black uppercase tracking-widest text-slate-500 border border-white/10 px-2 py-0.5 rounded-full">{p.type}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── SPECIAL EVENTS ── */}
        <section className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <div className="font-black text-white">Special Events This Week</div>
                <div className="text-[11px] text-slate-500">Tracked by the Special Events Coordinator — reminders, checklists, and prep auto-generated.</div>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{DEMO_EVENTS.length} upcoming</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {DEMO_EVENTS.map(e => {
              const typeColor: Record<string, string> = {
                wedding:   'border-rose-500/30 text-rose-300 bg-rose-500/10',
                corporate: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
                funeral:   'border-slate-500/30 text-slate-300 bg-slate-500/10',
                birthday:  'border-amber-500/30 text-amber-300 bg-amber-500/10',
                custom:    'border-violet-500/30 text-violet-300 bg-violet-500/10',
              };
              const statusColor: Record<string, string> = {
                confirmed:   'text-emerald-400',
                'in-progress': 'text-amber-400',
                preview:     'text-slate-400',
              };
              return (
                <div key={e.id} className="flex items-center gap-3 bg-[#111e36] rounded-xl border border-white/5 p-3">
                  <img src={e.image} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className={`text-[9px] font-black uppercase tracking-widest border rounded-full px-1.5 py-0.5 ${typeColor[e.type]}`}>{e.type}</span>
                      <span className="text-[10px] text-slate-500">{e.date}</span>
                    </div>
                    <div className="text-sm font-black text-white leading-tight truncate">{e.title}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      <span className="text-slate-400">{e.arrangements} arrangements</span>
                      <span className="text-slate-700">·</span>
                      <span className={`font-bold uppercase tracking-widest ${statusColor[e.status]}`}>{e.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── FEATURED REELS & TIKTOKS ── */}
        <section className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center">
              <Play className="h-4 w-4 text-pink-400" />
            </div>
            <div>
              <div className="font-black text-white">Featured Reels & TikToks</div>
              <div className="text-[11px] text-slate-500">Top-performing video content this week — drafted by Visual Director, approved by you.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {[
              { id: 1, platform: 'INSTAGRAM', duration: '0:58', title: '"For the Women Who Bloom Us" — Mother\'s Day reel', views: '12.4k', image: '/images/demo/mothers-day.png', accent: 'from-pink-600/60 to-rose-900/80' },
              { id: 2, platform: 'TIKTOK',    duration: '0:42', title: 'Wrapping a peony bouquet timelapse',              views: '38.1k', image: '/images/demo/reel-wrap.png', accent: 'from-purple-600/60 to-pink-900/80' },
              { id: 3, platform: 'INSTAGRAM', duration: '1:14', title: 'Behind the Bouquet — Sarah & James preview',      views: '8.7k',  image: '/images/demo/wedding.png', accent: 'from-rose-500/60 to-pink-900/80' },
              { id: 4, platform: 'TIKTOK',    duration: '0:31', title: "POV: I'm the bouquet she sent herself",           views: '24.6k', image: '/images/demo/mothers-day.png', accent: 'from-indigo-600/60 to-purple-900/80' },
              { id: 5, platform: 'TIKTOK',    duration: '0:55', title: '5 trends florists are doing for spring weddings', views: '61.2k', image: '/images/demo/wedding.png', accent: 'from-pink-500/60 to-rose-900/80' },
              { id: 6, platform: 'INSTAGRAM', duration: '0:47', title: 'How we styled the Hartmann reception arch',       views: '5.3k',  image: '/images/demo/reel-arch.png', accent: 'from-rose-600/60 to-pink-900/80' },
            ].map(r => (
              <div key={r.id} className="relative rounded-2xl overflow-hidden cursor-pointer group" style={{ aspectRatio: '9/16' }}>
                <img src={r.image} alt={r.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className={`absolute inset-0 bg-gradient-to-t ${r.accent} to-transparent`} />
                <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${r.platform === 'TIKTOK' ? 'bg-black text-white' : 'bg-white/20 text-white backdrop-blur-sm'}`}>
                    {r.platform}
                  </span>
                  <span className="text-[9px] font-black bg-black/60 text-white px-1.5 py-0.5 rounded">{r.duration}</span>
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border border-white/40 flex items-center justify-center group-hover:bg-white/30 transition-all group-hover:scale-110">
                    <Play className="h-4 w-4 text-white fill-white ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-2.5">
                  <div className="text-[11px] font-bold text-white leading-snug mb-1.5 line-clamp-2">{r.title}</div>
                  <div className="flex items-center gap-1 text-[10px] text-white/70">
                    <Eye className="h-3 w-3" />
                    <span>{r.views} views</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
