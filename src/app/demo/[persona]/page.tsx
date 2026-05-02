'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Play, Pause, X, Activity, MessageCircle, CheckCircle2, TrendingUp, Bot,
  Flower2, Stethoscope, Hammer, Clock, Settings, Zap, Send, ChevronDown,
  TimerReset, Users, ArrowRight, Sparkles,
} from 'lucide-react';
import { getPersona, impactFor, buildInitialActivityFor, makeActivityFor, type PersonaConfig } from '@/lib/demoPersonas';

const RATE = 24;

const ICON_MAP = { Flower2, Stethoscope, Hammer } as const;

const ACCENT = {
  rose:  { ring: 'border-rose-500/30',  bg: 'bg-rose-500/10',  text: 'text-rose-400',  pulse: 'bg-rose-400'  },
  cyan:  { ring: 'border-cyan-500/30',  bg: 'bg-cyan-500/10',  text: 'text-cyan-400',  pulse: 'bg-cyan-400'  },
  amber: { ring: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400', pulse: 'bg-amber-400' },
} as const;

const TONE = {
  rose:    'border-rose-500/20 text-rose-400 bg-rose-500/10',
  violet:  'border-violet-500/20 text-violet-400 bg-violet-500/10',
  emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
  amber:   'border-amber-500/20 text-amber-400 bg-amber-500/10',
  cyan:    'border-cyan-500/20 text-cyan-400 bg-cyan-500/10',
  blue:    'border-blue-500/20 text-blue-400 bg-blue-500/10',
} as const;

export default function DemoPersonaPage() {
  const params = useParams();
  const router = useRouter();
  const slug = (params?.persona as string) || 'florist';
  const persona: PersonaConfig = useMemo(() => getPersona(slug), [slug]);
  const impact = useMemo(() => impactFor(persona), [persona]);
  const Icon = ICON_MAP[persona.iconKey];
  const accent = ACCENT[persona.accent];

  const [running, setRunning] = useState(false);
  const [activity, setActivity] = useState(() => buildInitialActivityFor(persona, 8));
  const [ops, setOps] = useState({ tokens: 4_245_864, hours: 22.76, cost: 546.45, tasks: 67 });
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [activeWorkflow, setActiveWorkflow] = useState(0);
  const [savedSecondsToday, setSavedSecondsToday] = useState(127_400); // ~35 hrs by default

  // Reset state if persona changes
  useEffect(() => {
    setActivity(buildInitialActivityFor(persona, 8));
    setOps({ tokens: 4_245_864, hours: 22.76, cost: 546.45, tasks: 67 });
    setRunning(false);
    setExpandedAgent(null);
    setActiveWorkflow(0);
    setSavedSecondsToday(127_400);
  }, [persona.slug]);

  // Live "time saved today" counter while demo is running
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => setSavedSecondsToday(s => s + 1.7), 1000);
    return () => clearInterval(tick);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    let seed = 8;
    const a = setInterval(() => {
      setActivity(prev => [makeActivityFor(persona, seed++, Date.now()), ...prev].slice(0, 10));
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
  }, [running, persona]);

  const liveAgents = persona.agents.filter(a => a.status === 'running').slice(0, 6);
  const offAgents = persona.agents.filter(a => a.status !== 'running').slice(0, 6);
  const totalAgents = persona.agents.length;
  const saved = Math.max(0, Math.round((1 - ops.cost / persona.humanCostMonthly) * 100));

  const personaSwitch: { slug: string; label: string }[] = [
    { slug: 'florist',     label: 'Petal & Stem' },
    { slug: 'dental',      label: 'Bright Smile' },
    { slug: 'brandhaven',  label: 'Cogeco Homes' },
  ];

  return (
    <div className="min-h-screen bg-[#080f1e] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#080f1e]/95 backdrop-blur border-b border-white/5 px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${accent.bg} border ${accent.ring} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${accent.text}`} />
          </div>
          <div>
            <div className="font-black text-sm">{persona.businessName}</div>
            <div className="text-[10px] text-slate-500">{persona.tagline}</div>
          </div>
          <span className={`ml-2 text-[9px] font-black uppercase tracking-widest ${accent.bg} ${accent.text} border ${accent.ring} px-2 py-0.5 rounded-full`}>
            {persona.industry} · Live Demo
          </span>
        </div>

        {/* Persona switcher */}
        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/5 rounded-xl p-1">
          {personaSwitch.map(p => (
            <button
              key={p.slug}
              onClick={() => router.push(`/demo/${p.slug}`)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-colors ${
                p.slug === persona.slug ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden md:inline">
            {persona.nextEvent.name} in <strong className={accent.text}>{persona.nextEvent.daysOut} days</strong>
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

        {/* PITCH BANNER — sales rep reads this to the prospect */}
        <section className={`relative rounded-2xl border ${accent.ring} ${accent.bg} p-6 md:p-8 overflow-hidden`}>
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
              backgroundSize: '24px 24px',
            }}
          />
          <div className="relative grid md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-2">
              <div className={`inline-flex items-center gap-2 ${accent.text} text-[10px] font-black uppercase tracking-[0.2em] mb-3`}>
                <Sparkles className="h-3.5 w-3.5" />
                The Pitch
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white leading-tight tracking-tight">{persona.pitch.headline}</h2>
              <p className="mt-3 text-sm md:text-base text-slate-300 leading-relaxed">{persona.pitch.subhead}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-rose-300 mb-1.5">Today (without agents)</p>
                <p className="text-xs text-slate-300 leading-relaxed">{persona.pitch.problemBefore}</p>
              </div>
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300 mb-1.5">After deploy (with agents)</p>
                <p className="text-xs text-slate-300 leading-relaxed">{persona.pitch.solutionAfter}</p>
              </div>
            </div>
          </div>
        </section>

        {/* TIME SAVED TODAY — live counter */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#0d1629] rounded-2xl border border-emerald-500/20 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <TimerReset className={`h-6 w-6 text-emerald-400 ${running ? 'animate-pulse' : ''}`} />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Time Saved Today</p>
              <p className="text-2xl font-black text-emerald-400 tabular-nums">{formatHMS(savedSecondsToday)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                {running ? 'ticking up in real time' : 'press Start Demo to watch this rise'}
              </p>
            </div>
          </div>
          <div className="bg-[#0d1629] rounded-2xl border border-blue-500/20 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">FTEs Replaced This Week</p>
              <p className="text-2xl font-black text-white tabular-nums">{impact.fteEquivalent} FTE</p>
              <p className="text-[10px] text-slate-500 mt-0.5">at 40 hrs / week each</p>
            </div>
          </div>
          <div className="bg-[#0d1629] rounded-2xl border border-amber-500/20 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Annual Cost Saved</p>
              <p className="text-2xl font-black text-amber-400 tabular-nums">${impact.annualCostSaved.toLocaleString()}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">vs hiring at ${impact.hourlyRate}/hr</p>
            </div>
          </div>
        </section>

        {/* WORKFLOW WALKTHROUGH — show one agent's job step by step */}
        {persona.workflows.length > 0 && (() => {
          const wf = persona.workflows[activeWorkflow];
          return (
            <section className="bg-[#0d1629] rounded-2xl border border-white/5 overflow-hidden">
              <div className="px-6 py-5 border-b border-white/5 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white">Watch the Agent Work</span>
                      <span className="text-[9px] font-black bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        sales-ready walkthrough
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{wf.scenario}</div>
                  </div>
                </div>
                {persona.workflows.length > 1 && (
                  <div className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-xl p-1">
                    {persona.workflows.map((w, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveWorkflow(i)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                          i === activeWorkflow ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {w.agentName.replace(/-/g, ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* before vs with comparison */}
              <div className="grid md:grid-cols-2 gap-4 p-6 border-b border-white/5">
                <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-rose-300">Without agents</span>
                  </div>
                  <p className="text-3xl font-black text-rose-400 mb-2">{wf.beforeAgents.duration}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{wf.beforeAgents.description}</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">With agents</span>
                  </div>
                  <p className="text-3xl font-black text-emerald-400 mb-2">{wf.withAgents.duration}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{wf.withAgents.description}</p>
                </div>
              </div>

              {/* steps timeline */}
              <div className="p-6">
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">Trigger: {wf.trigger}</div>
                <div className="space-y-3">
                  {wf.steps.map((s, i) => (
                    <div key={s.step} className="flex items-start gap-4 p-4 rounded-xl bg-white/3 border border-white/5">
                      <div className={`shrink-0 w-8 h-8 rounded-lg ${accent.bg} border ${accent.ring} flex items-center justify-center text-[11px] font-black ${accent.text}`}>
                        {s.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <span className="text-sm font-black text-white">{s.label}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                            {s.human_minutes >= 60 ? `${(s.human_minutes / 60).toFixed(0)} hrs` : `${s.human_minutes} min`} → {s.agent_seconds}s
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mt-1">{s.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black text-white">{wf.outcome}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-blue-500/10 border border-blue-500/20 p-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Sales rep, say this:</p>
                      <p className="text-sm text-slate-200 italic leading-relaxed">{wf.pitchLine}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        {/* KPI ROW */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {persona.kpiRow.map((k, i) => (
            <div key={i} className={`rounded-2xl border p-4 ${TONE[k.tone]}`}>
              <div className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">{k.label}</div>
              <div className="text-3xl font-black text-white">{k.value}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{k.sub}</div>
            </div>
          ))}
        </section>

        {/* COMMAND CENTER CONTROLS */}
        <section className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Settings className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-black text-white">Command Center</div>
              <div className="text-[11px] text-slate-500">Pause an agent, escalate to a human, or push out a one-off task.</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <CommandButton icon={Pause} label="Pause All Agents" sub="Halt every agent immediately" />
            <CommandButton icon={Send} label="Push New Task" sub={`Run a one-off across ${persona.agents.length} agents`} />
            <CommandButton icon={Bot} label="Add Agent" sub="Spin up a new specialist" />
            <CommandButton icon={MessageCircle} label="Escalate to Human" sub="Route the next decision to a person" />
          </div>
        </section>

        {/* AGENTS — RUNNING */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest text-emerald-300">Agents Running Now</span>
            </div>
            <span className="text-xs text-slate-500">{liveAgents.length} of {totalAgents} active</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
            {liveAgents.map(agent => {
              const explain = persona.agentExplanations[agent.name];
              const isOpen = expandedAgent === agent.name;
              return (
                <div key={agent.name} className={`bg-[#0d1629] rounded-xl border ${isOpen ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/10' : 'border-emerald-500/20'} p-3 transition-all`}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Live</span>
                  </div>
                  <div className="font-black text-white text-sm mb-1 leading-tight">{agent.label}</div>
                  <div className="text-[10px] text-slate-400 mb-3 leading-relaxed">{agent.outcomeMetric}</div>
                  {running && agent.currentTask && (
                    <div className="text-[10px] text-slate-300 bg-black/30 rounded-lg px-2 py-1.5 mb-2 leading-snug">
                      {agent.currentTask}
                    </div>
                  )}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-1 rounded-lg text-center mb-2">
                    saves {agent.weeklyHoursSaved}h/wk
                  </div>
                  {explain && (
                    <button
                      onClick={() => setExpandedAgent(isOpen ? null : agent.name)}
                      className="w-full flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white py-1.5 rounded-lg bg-white/3 hover:bg-white/8 border border-white/5 transition-colors"
                    >
                      {isOpen ? 'Hide details' : 'How it saves time'}
                      <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                  {isOpen && explain && (
                    <div className="mt-2 space-y-2">
                      <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300 mb-1">How it works</p>
                        <p className="text-[10px] text-slate-300 leading-snug">{explain.howItWorks}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-2">
                        <p className="text-[9px] font-black uppercase tracking-widest text-emerald-300 mb-1">Replaces</p>
                        <p className="text-[10px] text-slate-300 leading-snug">{explain.replaces}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* AGENTS — OFF */}
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

        {/* LIVE ACTIVITY */}
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

        {/* IMPACT + OPS COST GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <section className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <div className="font-black text-white">Impact — what this would cost in human hours</div>
                <div className="text-[11px] text-slate-500">Estimated against ${impact.hourlyRate}/hr blended rate.</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'HRS / WEEK SAVED',     value: `${impact.weeklyHoursSaved} hrs`, sub: `across ${totalAgents} sub-agents`, color: 'text-emerald-400' },
                { label: 'FULL-TIME ROLES',      value: `${impact.fteEquivalent} FTE`,    sub: 'at 40 hrs/wk',                       color: 'text-white'       },
                { label: 'ANNUAL HRS SAVED',     value: `${impact.annualHoursSaved.toLocaleString()} hrs`, sub: '52-week projection', color: 'text-white'       },
                { label: 'ANNUAL COST SAVED',    value: `$${(impact.annualCostSaved / 1000).toFixed(1)}k`, sub: 'vs. hiring',         color: 'text-emerald-400' },
              ].map(k => (
                <div key={k.label} className="border-l-2 border-white/5 pl-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{k.label}</div>
                  <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-[#0d1629] rounded-2xl border border-white/5 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Activity className="h-4 w-4 text-violet-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-white">Live Operating Cost</span>
                  {running && <span className="text-[9px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full animate-pulse">● ticking</span>}
                </div>
                <div className="text-[11px] text-slate-500">${RATE}/hr only when active. No salary, no benefits.</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'TOKENS / MO',  value: `${(ops.tokens / 1_000_000).toFixed(2)} M`, sub: `${ops.tokens.toLocaleString()} total`,                          color: 'text-white'       },
                { label: 'ACTIVE RUNTIME', value: `${ops.hours} hrs`,                       sub: 'this month',                                                     color: 'text-white'       },
                { label: 'COST / MONTH', value: `$${ops.cost.toFixed(2)}`,                  sub: `${ops.tasks} tasks today`,                                       color: 'text-white'       },
                { label: 'VS HUMAN TEAM',value: `${saved}% saved`,                          sub: `$${persona.humanCostMonthly.toLocaleString()}/mo human cost`,    color: 'text-emerald-400' },
              ].map(k => (
                <div key={k.label} className="border-l-2 border-white/5 pl-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{k.label}</div>
                  <div className={`text-2xl font-black ${k.color}`}>{k.value}</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">{k.sub}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

function formatHMS(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

function CommandButton({ icon: Icon, label, sub }: { icon: any; label: string; sub: string }) {
  return (
    <button className="text-left bg-white/3 hover:bg-white/8 border border-white/5 hover:border-white/15 rounded-xl p-4 transition-all group">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
        <span className="text-sm font-bold text-white">{label}</span>
      </div>
      <p className="text-[11px] text-slate-500 leading-snug">{sub}</p>
    </button>
  );
}
