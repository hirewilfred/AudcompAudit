'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    ArrowLeft, Loader2, ShieldAlert, Mail, Phone, Building2,
    TrendingUp, AlertTriangle, Sparkles, ClipboardList, Target,
    ExternalLink, Bot, Zap, ChevronRight,
} from 'lucide-react';
import AdminNavbar from '@/components/AdminNavbar';
import { ADVISOR_STEPS, AdvisorResponses } from '@/lib/advisor-questions';
import { AGENT_ASSESSMENT_STEPS } from '@/lib/agent-assessment';
import { AGENT_CATALOG } from '@/lib/agent-catalog';

type DetailResponse = {
    profile: {
        id: string;
        full_name: string | null;
        email: string | null;
        organization: string | null;
        phone: string | null;
        has_completed_audit: boolean;
        assigned_expert_id: string | null;
        created_at: string;
        updated_at: string;
        _placeholder?: boolean;
    } | null;
    expert: { id: string; full_name: string | null; email: string | null; photo_url: string | null; bookings_url: string | null; } | null;
    score: { overall_score: number; category_scores: Record<string, number> | null; recommendations: string[] | null; created_at: string; } | null;
    report: {
        responses: AdvisorResponses & {
            aa_priority_dept?: string;
            aa_outcomes?: string[];
            aa_repetitive_hours?: string;
            aa_stack?: string[];
            aa_pace?: string;
            aa_recommended_agent_ids?: string[];
            aa_recommended_package?: 2 | 4 | 6;
        };
        recommendations: any[] | null;
        roadmap: any[] | null;
        narrative: string | null;
        roi_parameters: any | null;
        updated_at: string;
    } | null;
};

const scoreTone = (s: number | null) => {
    if (s == null) return { text: 'text-slate-500', bg: 'bg-white/5', border: 'border-white/10', bar: 'from-slate-600 to-slate-500' };
    if (s >= 75) return { text: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', bar: 'from-emerald-500 to-emerald-400' };
    if (s >= 50) return { text: 'text-amber-300', bg: 'bg-amber-500/10', border: 'border-amber-500/20', bar: 'from-amber-500 to-amber-400' };
    return { text: 'text-rose-300', bg: 'bg-rose-500/10', border: 'border-rose-500/20', bar: 'from-rose-500 to-rose-400' };
};

const ALL_FIELDS = (() => {
    const map = new Map<string, { label: string; type: 'radio' | 'select' | 'multiselect'; options: { value: string; label: string }[]; stepTitle: string; }>();
    for (const step of ADVISOR_STEPS)
        for (const f of step.fields)
            map.set(f.id, { label: f.label, type: f.type, options: f.options, stepTitle: step.title });
    for (const step of AGENT_ASSESSMENT_STEPS)
        for (const f of step.fields)
            map.set(f.id, { label: f.label, type: f.type, options: f.options, stepTitle: step.title });
    return map;
})();

function labelFor(fieldId: string, value: string | undefined): string {
    if (!value) return '—';
    const f = ALL_FIELDS.get(fieldId);
    if (!f) return value;
    return f.options.find(o => o.value === value)?.label ?? value;
}

function MultiTags({ fieldId, values, tone }: { fieldId: string; values: string[]; tone: 'rose' | 'cyan' | 'emerald' }) {
    if (!values?.length) return <span className="text-slate-600 text-xs">—</span>;
    const cls = tone === 'rose' ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
        : tone === 'cyan' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20'
        : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    return (
        <div className="flex flex-wrap gap-1.5">
            {values.map(v => (
                <span key={v} className={`inline-flex items-center text-[11px] font-bold border px-2.5 py-1 rounded-full ${cls}`}>
                    {labelFor(fieldId, v)}
                </span>
            ))}
        </div>
    );
}

type PlayItem = { headline: string; why: string; pitch: string; service: string; price: string };
function buildSalesPlaybook(responses: AdvisorResponses, score: number | null): PlayItem[] {
    if (!responses) return [];
    const out: PlayItem[] = [];
    const budget = responses.monthly_budget as string | undefined;
    const aiUsage = responses.ai_usage as string | undefined;
    const storage = responses.file_storage as string | undefined;
    const sensitivity = responses.data_sensitivity as string | undefined;
    const timeline = responses.timeline as string | undefined;
    const pain = (responses.pain_points as string[]) || [];
    const isM365 = storage === 'sharepoint' || storage === 'mixed';
    const isGoogle = storage === 'google_drive';

    if (isM365) out.push({ headline: 'Lead with Microsoft 365 Copilot', why: 'Files already live in SharePoint/OneDrive — no migration tax.', pitch: 'Copilot drafts emails, summarizes Teams meetings, explains spreadsheets. Plug-in install + training + governance via Audcomp Managed AI.', service: 'Strategy Session + Copilot rollout', price: '$500–$1,200 setup · $30/user/mo' });
    else if (isGoogle) out.push({ headline: 'Bundle Gemini for Workspace', why: "Already standardized on Google Workspace.", pitch: "Gemini lives inside Gmail/Docs/Meet — no new tool to learn.", service: 'Strategy Session + Gemini rollout', price: '$500–$1,200 setup · $22–$30/user/mo' });
    else out.push({ headline: 'Cloud-first foundation play', why: 'Files local or third-party cloud — limits AI integration.', pitch: 'Migrate to M365 first; unlocks Copilot, security baseline, license MRR.', service: 'Discovery + Migration scoping', price: 'Free 30-min · $3K–$12K project' });

    if (pain.includes('document_processing') || pain.includes('manual_data_entry'))
        out.push({ headline: 'Custom AI Agent for documents/data', why: 'Document-heavy work and/or manual data entry flagged.', pitch: 'Standard Agent ingests invoices/POs/contracts and writes back into accounting + CRM.', service: 'Standard AI Agent Build', price: '$4,000–$9,000 build · $250–$500/mo retainer' });
    if (pain.includes('customer_service') || pain.includes('it_support'))
        out.push({ headline: 'Tier-1 Support Agent', why: 'Customer service / IT support response time called out.', pitch: 'Chat agent grounded on SOPs + KB. Deflects 40–60% of repeat tickets.', service: 'Standard AI Agent + KB integration', price: '$4,000–$9,000 build · $600–$1,200/mo retainer' });
    if (pain.includes('reporting') || pain.includes('forecasting'))
        out.push({ headline: 'BI / Forecasting accelerator', why: 'Reporting or financial forecasting struggles.', pitch: 'Connect Copilot/Gemini to finance + CRM data. Auto exec-ready weekly report.', service: 'Strategy + Custom Agent', price: '$1,500–$6,000 project' });

    if (aiUsage === 'none' || aiUsage === 'personal')
        out.push({ headline: 'Sell the team training package', why: "Early-stage with AI — adoption is the real risk.", pitch: 'Private workshop locks in usage, makes Copilot/Agent retainers stick.', service: 'Private Company Workshop', price: '$1,500–$6,000' });
    else if (aiUsage === 'strategy' || aiUsage === 'advanced')
        out.push({ headline: 'Move them up to Premium retainer', why: 'Advanced users need an SLA, not break-fix.', pitch: 'Premium retainer covers monitoring, model updates, quarterly net-new agents.', service: 'Premium / Dedicated Retainer', price: '$1,500+/mo' });

    if (sensitivity === 'high' || sensitivity === 'critical')
        out.push({ headline: 'Lead with Data Governance', why: `Data sensitivity is "${labelFor('data_sensitivity', sensitivity)}".`, pitch: 'Public LLMs are a non-starter. Scope private/enterprise deployment + DLP policy first.', service: 'Compliance scoping + Strategy Session', price: '$1,500–$6,000 project' });

    if (budget === '0-500' || budget === 'unsure')
        out.push({ headline: 'Start with the discovery call (free)', why: 'Budget small or undefined — anchor on quick wins.', pitch: 'Surface 1–2 ROI-positive plays under $500/mo, then graduate up the stack.', service: 'Free Discovery Call', price: 'Free — 30 min' });
    else if (budget === '5000+')
        out.push({ headline: 'Pitch the multi-agent program', why: 'They have $5K+/mo budget — single-tool leaves money on the table.', pitch: 'Bundle Copilot/Gemini + 2 custom agents + premium retainer into one quarterly program.', service: 'Advanced / Multi-Agent + Premium Retainer', price: '$10K+ build · $1,500+/mo' });

    if (score != null && score < 50)
        out.push({ headline: 'Reframe the low score as urgency', why: `AI Readiness is ${score}% — bottom-quartile.`, pitch: 'Show them where they sit vs. industry peers; the gap is itself the sales argument for a 6-month roadmap.', service: 'Full Project Engagement', price: '$3,000–$12,000' });
    if (timeline === 'asap')
        out.push({ headline: 'They want results in 30 days — close fast', why: '"ASAP — within 30 days" selected.', pitch: 'Lead with a Starter Agent or Copilot rollout shipping in 2–3 weeks.', service: 'Starter Agent or Copilot Quick-Start', price: '$1,497–$3,500 build' });

    return out;
}

export default function AdminAuditDetailPage() {
    const params = useParams();
    const router = useRouter();
    const userId = (params?.userId as string) || '';
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<DetailResponse | null>(null);
    const [forbidden, setForbidden] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;
        (async () => {
            try {
                const res = await fetch(`/api/admin/audit-detail?userId=${userId}`);
                if (res.status === 401) { router.push('/auth'); return; }
                if (res.status === 403) { setForbidden(true); return; }
                if (!res.ok) { setErrorMsg(`API error ${res.status}`); return; }
                const json = await res.json();
                setData(json);
            } catch (e: any) {
                console.error(e);
                setErrorMsg(e.message || 'Failed to load');
            } finally {
                setLoading(false);
            }
        })();
    }, [userId]);

    const overall = data?.score?.overall_score ?? null;
    const tone = scoreTone(overall);
    const categoryScores = data?.score?.category_scores || {};
    const sortedCategories = useMemo(
        () => Object.entries(categoryScores).map(([k, v]) => [k, Number(v)] as [string, number]).sort((a, b) => b[1] - a[1]),
        [categoryScores],
    );
    const lowest = sortedCategories.slice().sort((a, b) => a[1] - b[1]).slice(0, 3);
    const responses = data?.report?.responses || ({} as any);
    const playbook = useMemo(() => responses ? buildSalesPlaybook(responses, overall) : [], [responses, overall]);

    // Split responses into the two questionnaires
    const advisorResponses = useMemo(() => {
        const out: Record<string, any> = {};
        for (const step of ADVISOR_STEPS) for (const f of step.fields) if (responses[f.id] !== undefined) out[f.id] = responses[f.id];
        return out;
    }, [responses]);
    const agentAssessmentResponses = useMemo(() => {
        const out: Record<string, any> = {};
        for (const step of AGENT_ASSESSMENT_STEPS) for (const f of step.fields) if (responses[f.id] !== undefined) out[f.id] = responses[f.id];
        return out;
    }, [responses]);
    const recommendedAgentIds: string[] = (responses.aa_recommended_agent_ids as string[]) || [];
    const recommendedPackage: 2 | 4 | 6 | undefined = responses.aa_recommended_package as any;
    const recommendedAgents = useMemo(
        () => recommendedAgentIds.map(id => AGENT_CATALOG.find(a => a.id === id)).filter(Boolean) as typeof AGENT_CATALOG,
        [recommendedAgentIds],
    );

    const hasAdvisor = Object.keys(advisorResponses).length > 0;
    const hasAgentAssessment = Object.keys(agentAssessmentResponses).length > 0;

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center bg-[#050B1A]">
            <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
        </div>
    );

    if (forbidden) return (
        <div className="min-h-screen flex items-center justify-center bg-[#050B1A] p-6">
            <div className="max-w-md w-full bg-slate-900 rounded-3xl p-12 text-center border border-white/10">
                <ShieldAlert className="h-12 w-12 text-red-400 mx-auto mb-6" />
                <h1 className="text-3xl font-black text-white mb-4">Access Denied</h1>
                <p className="text-slate-400 mb-8">Admin only.</p>
                <button onClick={() => router.push('/dashboard')} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-500">Return</button>
            </div>
        </div>
    );

    if (errorMsg) return (
        <div className="min-h-screen bg-[#050B1A] text-white">
            <AdminNavbar />
            <main className="pl-64 pr-8 pt-8">
                <Link href="/admin/audits" className="text-sm text-slate-500 hover:text-white">← Back</Link>
                <p className="mt-12 text-rose-300">Couldn't load this customer: {errorMsg}</p>
            </main>
        </div>
    );

    if (!data?.profile && !data?.score && !data?.report) return (
        <div className="min-h-screen bg-[#050B1A] text-white">
            <AdminNavbar />
            <main className="pl-64 pr-8 pt-8">
                <Link href="/admin/audits" className="text-sm text-slate-500 hover:text-white">← Back to Audit Results</Link>
                <div className="mt-12 max-w-xl">
                    <h1 className="text-2xl font-black text-white mb-3">Nothing on file for this user yet</h1>
                    <p className="text-sm text-slate-400 leading-relaxed">
                        We couldn't find a profile, audit score, or AI advisor report for user <span className="font-mono text-slate-300">{userId}</span>.
                        This usually means the auth account exists but they haven't filled out either questionnaire yet.
                    </p>
                </div>
            </main>
        </div>
    );

    const p = data.profile;

    return (
        <div className="min-h-screen bg-[#050B1A] text-white">
            <div className="fixed top-0 right-0 h-[600px] w-[600px] rounded-full bg-violet-600/8 blur-[130px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-blue-600/5 blur-[130px] pointer-events-none" />

            <AdminNavbar />

            <main className="pl-64 pr-8 pt-8 pb-20 relative">
                <Link href="/admin/audits" className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-white mb-4">
                    <ArrowLeft className="h-3 w-3" /> Back to Audit Results
                </Link>

                {/* Customer header + score */}
                <div className="grid grid-cols-12 gap-6 mb-6">
                    <div className="col-span-8 bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 flex items-center gap-5">
                        <div className="w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/20 flex items-center justify-center text-violet-300 text-2xl font-black shrink-0">
                            {(p?.full_name || p?.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-2xl font-black text-white">{p?.full_name || 'No name on file'}</h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
                                {p?.organization && <span className="inline-flex items-center gap-1.5"><Building2 className="h-3 w-3" />{p.organization}</span>}
                                {p?.email && <a href={`mailto:${p.email}`} className="inline-flex items-center gap-1.5 hover:text-white"><Mail className="h-3 w-3" />{p.email}</a>}
                                {p?.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{p.phone}</span>}
                                <span className="text-slate-600 font-mono text-[10px]">{userId.slice(0, 8)}…</span>
                            </div>
                            <div className="flex items-center gap-2 mt-3">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                                    p?.has_completed_audit ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20' : 'bg-white/5 text-slate-500 border-white/10'
                                }`}>{p?.has_completed_audit ? 'Audit complete' : 'In progress'}</span>
                                {data.expert ? (
                                    <span className="text-[10px] font-bold text-slate-400 inline-flex items-center gap-1.5">
                                        Assigned to <span className="text-slate-200 font-black">{data.expert.full_name}</span>
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">Unassigned</span>
                                )}
                                {p?._placeholder && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20">No profile row</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className={`col-span-4 ${tone.bg} backdrop-blur-xl rounded-2xl border ${tone.border} p-6 flex flex-col justify-between`}>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overall AI Readiness</div>
                        <div className={`text-6xl font-black tabular-nums ${tone.text} leading-none my-2`}>
                            {overall != null ? `${overall}%` : '—'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-medium">
                            {data.score?.created_at ? `Scored ${new Date(data.score.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : 'No audit score yet'}
                        </div>
                    </div>
                </div>

                {/* How they got their score */}
                {sortedCategories.length > 0 && (
                    <Section icon={TrendingUp} title="How they got their score" tint="violet">
                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                            {sortedCategories.map(([cat, val]) => {
                                const t = scoreTone(val);
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-sm font-bold text-white">{cat}</span>
                                            <span className={`text-sm font-black tabular-nums ${t.text}`}>{val}%</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                                            <div className={`h-full bg-gradient-to-r ${t.bar}`} style={{ width: `${Math.min(100, Math.max(0, val))}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                )}

                {/* Where they need work */}
                {lowest.length > 0 && (
                    <Section icon={AlertTriangle} title="Where they need work" tint="rose">
                        <div className="grid grid-cols-3 gap-3">
                            {lowest.map(([cat, val]) => (
                                <div key={cat} className="bg-rose-500/5 border border-rose-500/15 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{cat}</span>
                                        <span className="text-lg font-black text-rose-300 tabular-nums">{val}%</span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">Below readiness threshold — biggest opportunity for an Audcomp engagement.</p>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* AI Audit answers */}
                {hasAdvisor && (
                    <Section icon={ClipboardList} title="AI Audit — questions they answered" tint="blue">
                        <div className="space-y-6">
                            {ADVISOR_STEPS.map(step => {
                                const stepHas = step.fields.some(f => responses[f.id] !== undefined);
                                if (!stepHas) return null;
                                return (
                                    <div key={step.id}>
                                        <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">{step.title}</div>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                            {step.fields.map(field => {
                                                const value = responses[field.id];
                                                if (value === undefined) return null;
                                                return (
                                                    <div key={field.id} className="border-b border-white/5 pb-2">
                                                        <div className="text-[11px] text-slate-500 font-medium mb-1">{field.label}</div>
                                                        {field.type === 'multiselect' ? (
                                                            <MultiTags fieldId={field.id} values={(value as string[]) || []} tone="rose" />
                                                        ) : (
                                                            <div className="text-sm font-bold text-white">{labelFor(field.id, value as string)}</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                )}

                {/* AI Agent Assessment answers */}
                {hasAgentAssessment && (
                    <Section icon={Bot} title="AI Agent Assessment — what they want from agents" tint="cyan">
                        <div className="space-y-6">
                            {AGENT_ASSESSMENT_STEPS.map(step => {
                                const stepHas = step.fields.some(f => responses[f.id] !== undefined);
                                if (!stepHas) return null;
                                return (
                                    <div key={step.id}>
                                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-3">{step.title}</div>
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                                            {step.fields.map(field => {
                                                const value = responses[field.id];
                                                if (value === undefined) return null;
                                                return (
                                                    <div key={field.id} className="border-b border-white/5 pb-2">
                                                        <div className="text-[11px] text-slate-500 font-medium mb-1">{field.label}</div>
                                                        {field.type === 'multiselect' ? (
                                                            <MultiTags fieldId={field.id} values={(value as string[]) || []} tone="cyan" />
                                                        ) : (
                                                            <div className="text-sm font-bold text-white">{labelFor(field.id, value as string)}</div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Section>
                )}

                {/* Recommended AI agents */}
                {recommendedAgents.length > 0 && (
                    <Section icon={Zap} title={`Recommended AI agents${recommendedPackage ? ` (${recommendedPackage}-agent package)` : ''}`} tint="emerald">
                        <div className="grid grid-cols-2 gap-3">
                            {recommendedAgents.map(a => (
                                <div key={a.id} className="bg-white/3 border border-emerald-500/15 rounded-xl p-4">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <h4 className="text-sm font-black text-white">{a.name}</h4>
                                            <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">{a.department.replace('_', ' / ')}</div>
                                        </div>
                                        <span className="text-[10px] font-black text-slate-400 tabular-nums bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                            {a.sampleStats.successRate}% success
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed mb-3">{a.description}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {a.tools.map(t => (
                                            <span key={t} className="text-[10px] font-bold bg-white/5 text-slate-300 border border-white/10 px-2 py-0.5 rounded-full">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Sales playbook */}
                {playbook.length > 0 && (
                    <Section icon={Target} title="Sales playbook — how to actually sell them" tint="emerald">
                        <div className="grid grid-cols-2 gap-3">
                            {playbook.map((p, i) => (
                                <div key={i} className="bg-white/3 border border-emerald-500/15 rounded-xl p-4">
                                    <div className="flex items-start gap-2 mb-2">
                                        <span className="shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md bg-emerald-500/15 text-emerald-300 text-[10px] font-black">{i + 1}</span>
                                        <h4 className="text-sm font-black text-white leading-snug">{p.headline}</h4>
                                    </div>
                                    <div className="text-[11px] text-slate-500 italic mb-2">Why → {p.why}</div>
                                    <p className="text-xs text-slate-300 leading-relaxed mb-3">{p.pitch}</p>
                                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
                                        <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">{p.service}</span>
                                        <span className="text-[10px] font-black text-slate-300 tabular-nums">{p.price}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Section>
                )}

                {/* Customer-facing roadmap */}
                {(data.report?.recommendations?.length || data.report?.roadmap?.length || data.report?.narrative) && (
                    <Section icon={Sparkles} title="AI Roadmap (customer's view)" tint="violet">
                        {data.report?.narrative && (
                            <div className="bg-white/3 border border-white/5 rounded-xl p-4 mb-5">
                                <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-2">Narrative summary</div>
                                <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{data.report.narrative}</p>
                            </div>
                        )}

                        {data.report?.recommendations && data.report.recommendations.length > 0 && (
                            <div className="mb-5">
                                <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3">Recommended tools</div>
                                <div className="grid grid-cols-2 gap-3">
                                    {data.report.recommendations.map((rec: any, i: number) => (
                                        <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-4">
                                            <div className="flex items-start justify-between gap-2 mb-1.5">
                                                <h4 className="text-sm font-black text-white">{rec.tool}</h4>
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                                                    rec.priority === 'high' ? 'bg-rose-500/15 text-rose-300'
                                                        : rec.priority === 'medium' ? 'bg-amber-500/15 text-amber-300'
                                                        : 'bg-white/5 text-slate-400'
                                                }`}>{rec.priority || 'med'}</span>
                                            </div>
                                            <div className="text-[10px] text-violet-400 font-bold uppercase tracking-widest mb-2">{rec.category}</div>
                                            <p className="text-xs text-slate-400 leading-relaxed mb-3">{rec.description}</p>
                                            <div className="flex items-center justify-between text-[10px] font-black text-slate-300 pt-2 border-t border-white/5">
                                                <span>{rec.monthlyEstimate}</span>
                                                <span>{rec.annualEstimate}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {data.report?.roadmap && data.report.roadmap.length > 0 && (
                            <div>
                                <div className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-3">Phased roadmap</div>
                                <div className="grid grid-cols-3 gap-3">
                                    {data.report.roadmap.map((phase: any, i: number) => (
                                        <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-violet-500/15 text-violet-300 text-[10px] font-black">{phase.phase || i + 1}</span>
                                                <h4 className="text-sm font-black text-white">{phase.title}</h4>
                                            </div>
                                            <div className="text-[10px] text-slate-500 font-bold mb-2">{phase.timeline}</div>
                                            <ul className="space-y-1.5">
                                                {(phase.items || []).map((it: string, j: number) => (
                                                    <li key={j} className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-relaxed">
                                                        <span className="text-violet-400 mt-0.5">•</span>{it}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-5 flex justify-end">
                            <Link href={`/ai-advisor/results?userId=${userId}`} target="_blank" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-violet-300 hover:text-violet-200">
                                Open the customer-facing roadmap <ExternalLink className="h-3 w-3" />
                            </Link>
                        </div>
                    </Section>
                )}

                {/* Empty state if neither questionnaire is on file */}
                {!hasAdvisor && !hasAgentAssessment && !data.score && (
                    <Section icon={ClipboardList} title="No questionnaires on file" tint="rose">
                        <p className="text-sm text-slate-400 leading-relaxed">
                            This user has an account but hasn't completed the AI Audit or the AI Agent Assessment yet.
                            Once they do, their answers, score breakdown, and recommendations will populate here automatically.
                        </p>
                    </Section>
                )}
            </main>
        </div>
    );
}

function Section({
    icon: Icon, title, tint, children,
}: { icon: any; title: string; tint: 'violet' | 'rose' | 'blue' | 'emerald' | 'cyan'; children: React.ReactNode }) {
    const map = {
        violet: 'text-violet-300 bg-violet-500/10 border-violet-500/20',
        rose: 'text-rose-300 bg-rose-500/10 border-rose-500/20',
        blue: 'text-blue-300 bg-blue-500/10 border-blue-500/20',
        emerald: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20',
        cyan: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/20',
    };
    return (
        <section className="bg-slate-900/40 backdrop-blur-xl rounded-2xl border border-white/5 p-6 mb-6">
            <div className="flex items-center gap-3 mb-5">
                <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${map[tint]}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-base font-black text-white">{title}</h2>
            </div>
            {children}
        </section>
    );
}
