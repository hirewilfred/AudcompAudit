'use client';

import { Bot, Workflow, FileSearch, RefreshCcw } from 'lucide-react';
import LandingPage, { LandingPageConfig } from '@/components/LandingPage';

const cfg: LandingPageConfig = {
    slug: 'custom-ai-agents',
    eyebrow: 'Custom AI Agents',
    headlineLead: 'Stop paying people to',
    headlineAccent: 'copy-paste data.',
    subhead: 'We build custom AI agents that ingest your invoices, contracts, leads, and tickets — then write the answers back into your CRM, accounting, or LOB system. Typical client recovers 40 hours a month.',
    heroBullets: [
        'Built for your stack — HubSpot, Salesforce, M365, QuickBooks, Zoho',
        '2-week starter agent, 6-week production agent',
        'You own the agent and the data',
        'Audcomp manages it — or train your team to',
    ],
    primaryCtaLabel: 'Get a custom agent quote',
    secondaryCtaLabel: 'See agent catalog',
    secondaryCtaHref: '/ai-agents',
    problems: [
        {
            icon: FileSearch,
            title: 'Documents pile up faster than you can read them',
            body: 'Invoices, contracts, claims, applications — a person opens each one, types fields into a system, then files it away. Every. Single. One.',
        },
        {
            icon: Workflow,
            title: 'Same task, every day, by your highest-paid people',
            body: 'CRM updates, lead enrichment, weekly reports, status emails. Repetitive work disguised as "knowledge work."',
        },
        {
            icon: RefreshCcw,
            title: 'New AI tools don\'t talk to your old systems',
            body: 'You bought ChatGPT for the team — now they paste data in and out of it manually. The integration tax negates the savings.',
        },
    ],
    solution: {
        title: 'Production-grade AI agents that plug into your stack.',
        bullets: [
            'Document Extraction Agent — pulls fields from invoices/POs/contracts/claims and writes them to your accounting + CRM.',
            'CRM Hygiene Agent — listens to call recordings + emails, updates contact records and logs next steps.',
            'Lead Enrichment Agent — fills missing emails, LinkedIn URLs, firmographics on inbound leads.',
            'Tier-1 Support Agent — grounded on your KB, deflects 40-60% of repeat tickets.',
            'Custom build — bring us your repetitive workflow and we\'ll scope an agent for it.',
        ],
    },
    outcomes: [
        { metric: '40 hrs', label: 'recovered / month' },
        { metric: '99.2%', label: 'extraction accuracy' },
        { metric: '8×', label: 'faster than manual' },
        { metric: '6 weeks', label: 'avg deployment' },
    ],
    proof: [
        {
            quote: 'They built us an invoice agent that pays for itself in 11 days. 99% accuracy out of the gate.',
            name: 'Asha P.',
            title: 'Controller, Clearview Accounting',
        },
        {
            quote: 'We were burning a full FTE on QC inspection notes. The agent now drafts them in 4 seconds.',
            name: 'Tom K.',
            title: 'Plant Manager, Precision Metal Works',
        },
        {
            quote: 'Audcomp owned the build top-to-bottom. We didn\'t need to hire an AI team.',
            name: 'Renee D.',
            title: 'COO, Summit Construction',
        },
    ],
    faq: [
        {
            q: 'How is this different from buying ChatGPT?',
            a: 'ChatGPT is a chatbot in a tab. A custom agent runs continuously, plugs into your existing systems, and writes its results back where work actually happens. No copy-paste.',
        },
        {
            q: 'What if our data is sensitive?',
            a: 'We deploy on Azure or AWS in your tenant. Your data never leaves your environment. We can also use private models for HIPAA / PIPEDA / financial workloads.',
        },
        {
            q: 'How much does it cost?',
            a: 'Starter agents run $1,497–$3,500. Standard agents are $4K–$9K build + $250–$500/mo retainer. Multi-agent operations: $10K+ build + $1,500+/mo.',
        },
        {
            q: 'Can our team manage it after launch?',
            a: 'Yes. We hand off documentation + train one of your engineers. Or you stay on retainer and we maintain it. Your call.',
        },
    ],
    formCtaTitle: 'Tell us about the workflow that\'s eating your time.',
    formCtaSub: 'We\'ll send back a 1-pager with proposed agent architecture, scope, and price within 48 hours.',
    successHeadline: 'Got it.',
    successBody: 'A senior engineer will reach out within 1 business day to scope the build.',
};

export default function Page() { return <LandingPage cfg={cfg} />; }
