import { AGENT_CATALOG, AgentCatalogEntry } from './agent-catalog';

export interface AgentAssessmentField {
    id: string;
    label: string;
    type: 'radio' | 'multiselect';
    options: { value: string; label: string; description?: string }[];
}

export interface AgentAssessmentStep {
    id: string;
    title: string;
    subtitle: string;
    fields: AgentAssessmentField[];
}

// Five focused questions purpose-built to map a business onto the agent catalog.
// Stored under aa_* keys inside ai_advisor_reports.responses (no DB migration).
export const AGENT_ASSESSMENT_STEPS: AgentAssessmentStep[] = [
    {
        id: 'aa_priority',
        title: 'Where do you want AI agents to start?',
        subtitle: 'Pick the department where shipping an agent in the next 30 days would have the biggest impact.',
        fields: [{
            id: 'aa_priority_dept',
            label: 'Top priority department',
            type: 'radio',
            options: [
                { value: 'sales',           label: 'Sales',            description: 'Lead gen, outreach, CRM hygiene, forecasting' },
                { value: 'marketing',       label: 'Marketing',        description: 'Content, social, email, SEO/GEO' },
                { value: 'customer_service',label: 'Customer Service', description: 'DMs, tickets, after-hours, voice of customer' },
                { value: 'operations',      label: 'Operations',       description: 'Document extraction, scheduling, SOP search' },
                { value: 'finance_hr',      label: 'Finance / HR',     description: 'AP invoices, recruiting, expense review' },
            ],
        }],
    },
    {
        id: 'aa_outcomes',
        title: 'What outcomes are you optimizing for?',
        subtitle: 'Select every outcome that matters — agents are scored against these.',
        fields: [{
            id: 'aa_outcomes',
            label: 'Outcomes to chase',
            type: 'multiselect',
            options: [
                { value: 'pipeline',           label: 'Pipeline & lead volume',           description: 'More qualified meetings booked' },
                { value: 'response_speed',     label: 'Faster customer response time',    description: 'Tier-1 questions answered instantly' },
                { value: 'content_volume',     label: 'Higher content output',            description: 'Posts, captions, blogs, ads' },
                { value: 'data_quality',       label: 'Cleaner data',                     description: 'Enriched contacts, dedupe, accurate CRM' },
                { value: 'doc_throughput',     label: 'Process more documents',           description: 'Invoices, contracts, claims' },
                { value: 'cost_savings',       label: 'Direct cost / hours saved',        description: 'Replace manual work hours' },
                { value: 'compliance_audit',   label: 'Compliance & audit readiness',     description: 'Continuous evidence collection' },
                { value: 'after_hours_cover',  label: '24/7 coverage',                    description: 'Always-on customer presence' },
            ],
        }],
    },
    {
        id: 'aa_volume',
        title: 'How much repetitive work is sitting in this department?',
        subtitle: 'Used to size the package and pick which agents lead.',
        fields: [{
            id: 'aa_repetitive_hours',
            label: 'Repetitive / copy-paste hours per week (across the team)',
            type: 'radio',
            options: [
                { value: '0-10',   label: '0–10 hrs / wk',  description: 'Small impact area' },
                { value: '10-40',  label: '10–40 hrs / wk', description: 'One full role of friction' },
                { value: '40-80',  label: '40–80 hrs / wk', description: 'Two full roles of friction' },
                { value: '80+',    label: '80+ hrs / wk',   description: 'Three or more roles of friction' },
            ],
        }],
    },
    {
        id: 'aa_stack',
        title: 'Which systems should the agents plug into?',
        subtitle: 'Pick everything you currently use — agents are wired to your real stack.',
        fields: [{
            id: 'aa_stack',
            label: 'Existing tools',
            type: 'multiselect',
            options: [
                { value: 'm365',         label: 'Microsoft 365 / SharePoint' },
                { value: 'google',       label: 'Google Workspace / Drive' },
                { value: 'salesforce',   label: 'Salesforce' },
                { value: 'hubspot',      label: 'HubSpot' },
                { value: 'dynamics',     label: 'Dynamics 365' },
                { value: 'zoho',         label: 'Zoho' },
                { value: 'quickbooks',   label: 'QuickBooks / Xero' },
                { value: 'meta',         label: 'Instagram / Facebook' },
                { value: 'tiktok',       label: 'TikTok' },
                { value: 'linkedin',     label: 'LinkedIn' },
                { value: 'zendesk',      label: 'Zendesk / Intercom' },
            ],
        }],
    },
    {
        id: 'aa_decision',
        title: 'How fast do you want to ship?',
        subtitle: 'Drives whether we recommend the 2, 4, or 6-agent package.',
        fields: [{
            id: 'aa_pace',
            label: 'Target pace',
            type: 'radio',
            options: [
                { value: 'starter',    label: 'Start small — 2 agents',             description: 'Prove the model with one quick win' },
                { value: 'growth',     label: 'Growth — 4 agents across departments',description: 'Cover the departments that bleed the most time' },
                { value: 'enterprise', label: 'Enterprise — 6+ agents',             description: 'Full operating system across the business' },
            ],
        }],
    },
];

export type AgentAssessmentResponses = Record<string, string | string[]>;

export interface AgentRecommendation {
    package: 2 | 4 | 6;
    reason: string;
    agents: AgentCatalogEntry[];
}

// Heuristic recommender — ranks the catalog against the responses and returns 2 / 4 / 6 agents.
export function recommendAgents(responses: AgentAssessmentResponses): AgentRecommendation {
    const dept = (responses.aa_priority_dept as string) || '';
    const outcomes = (responses.aa_outcomes as string[]) || [];
    const stack = (responses.aa_stack as string[]) || [];
    const hours = (responses.aa_repetitive_hours as string) || '0-10';
    const pace = (responses.aa_pace as string) || '';

    // Decide package size — pace wins; otherwise scale by hours.
    let pkg: 2 | 4 | 6 = 2;
    if (pace === 'enterprise') pkg = 6;
    else if (pace === 'growth') pkg = 4;
    else if (pace === 'starter') pkg = 2;
    else if (hours === '80+')   pkg = 6;
    else if (hours === '40-80') pkg = 4;
    else if (hours === '10-40') pkg = 4;
    else                        pkg = 2;

    // Score each agent in the catalog.
    const score = (a: AgentCatalogEntry) => {
        let s = 0;

        // Department fit — biggest weight
        if (a.department === dept) s += 60;
        // Marketing Orchestrator anchors any marketing pick
        if (a.id === 'marketing-orchestrator' && dept === 'marketing') s += 25;

        // Outcome alignment
        if (outcomes.includes('pipeline')          && ['lead-hunter', 'lead-enricher', 'outreach-strategist', 'crm-hygiene'].includes(a.id)) s += 30;
        if (outcomes.includes('response_speed')    && ['engagement-responder', 'tier1-ticket-agent'].includes(a.id))                          s += 30;
        if (outcomes.includes('content_volume')    && ['content-strategist', 'caption-writer', 'visual-director', 'scheduler', 'seo-geo-agent'].includes(a.id)) s += 30;
        if (outcomes.includes('data_quality')      && ['lead-enricher', 'crm-hygiene'].includes(a.id))                                        s += 25;
        if (outcomes.includes('doc_throughput')    && a.id === 'doc-extraction-agent')                                                        s += 30;
        if (outcomes.includes('cost_savings')      && ['ap-invoice-agent', 'doc-extraction-agent', 'scheduler'].includes(a.id))               s += 20;
        if (outcomes.includes('compliance_audit')  && a.id === 'sop-knowledge-agent')                                                         s += 20;
        if (outcomes.includes('after_hours_cover') && ['engagement-responder', 'tier1-ticket-agent'].includes(a.id))                          s += 25;

        // Stack alignment — small nudges
        if (stack.includes('m365')       && a.tools.some(t => /SharePoint|Office|Azure/i.test(t))) s += 8;
        if (stack.includes('google')     && a.tools.some(t => /Google/i.test(t)))                  s += 8;
        if (stack.includes('hubspot')    && a.tools.some(t => /HubSpot/i.test(t)))                 s += 8;
        if (stack.includes('salesforce') && a.tools.some(t => /Salesforce/i.test(t)))              s += 8;
        if (stack.includes('quickbooks') && a.tools.some(t => /QuickBooks|Xero/i.test(t)))         s += 8;
        if (stack.includes('meta')       && a.tools.some(t => /Meta|Instagram|Facebook/i.test(t))) s += 8;
        if (stack.includes('tiktok')     && a.tools.some(t => /TikTok/i.test(t)))                  s += 8;
        if (stack.includes('linkedin')   && a.tools.some(t => /LinkedIn/i.test(t)))                s += 8;
        if (stack.includes('zendesk')    && a.tools.some(t => /Zendesk|Intercom/i.test(t)))        s += 8;

        return s;
    };

    const ranked = [...AGENT_CATALOG].sort((a, b) => score(b) - score(a));

    // Always include the orchestrator if marketing was the priority and we have room.
    let chosen = ranked.slice(0, pkg);
    if (dept === 'marketing') {
        const orch = AGENT_CATALOG.find(a => a.id === 'marketing-orchestrator')!;
        if (!chosen.find(a => a.id === orch.id)) {
            chosen = [orch, ...chosen.slice(0, pkg - 1)];
        }
    }

    const reason = pkg === 6
        ? 'You flagged 80+ hrs/week of repetitive work — a 6-agent operating system covers all the gaps.'
        : pkg === 4
        ? 'Your priorities span multiple departments — 4 agents covers the highest-friction ones first.'
        : 'You wanted to start small — 2 focused agents will prove the model and ship the first quick win.';

    return { package: pkg, reason, agents: chosen };
}
