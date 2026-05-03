'use client';

import { Shield, Server, Network, BadgeDollarSign } from 'lucide-react';
import LandingPage, { LandingPageConfig } from '@/components/LandingPage';

const cfg: LandingPageConfig = {
    slug: 'audcomp-360',
    eyebrow: 'Audcomp 360',
    headlineLead: 'Managed IT, Security, and AI —',
    headlineAccent: 'one team, one bill.',
    subhead: 'Audcomp 360 bundles your IT support, Microsoft 365 management, cybersecurity, and AI deployments into one predictable monthly contract. No more juggling vendors, no more finger-pointing.',
    heroBullets: [
        'One vendor for IT, M365, security, and AI',
        'Per-user monthly pricing — predictable, scalable',
        '4-hour SLA for critical issues',
        'Used by 200+ Canadian businesses',
    ],
    primaryCtaLabel: 'Get a custom 360 quote',
    secondaryCtaLabel: 'Talk to a real human',
    secondaryCtaHref: 'tel:+19055475262',
    problems: [
        {
            icon: Network,
            title: 'You\'re juggling 6+ IT vendors',
            body: 'M365 reseller, antivirus vendor, the IT guy your sister-in-law recommended, the Wi-Fi installer — when something breaks, nobody owns it.',
        },
        {
            icon: BadgeDollarSign,
            title: 'IT costs are unpredictable',
            body: 'A "cheap" $30/user M365 plan turns into $400 emergency calls every quarter. Budgeting is impossible.',
        },
        {
            icon: Server,
            title: 'Security is an afterthought',
            body: 'Most SMB breaches start with a missed patch or a stale account. Without a single owner, things slip through the cracks.',
        },
    ],
    solution: {
        title: 'One contract. One team. Total coverage.',
        bullets: [
            'Microsoft 365 license management — right-sized monthly, true-ups handled.',
            'Tier-1 to Tier-3 helpdesk — phone, email, Teams, your office.',
            'Endpoint protection + monitoring — 24/7 SOC, patch management, MFA enforcement.',
            'Backup + disaster recovery — daily, off-site, tested quarterly.',
            'AI rollouts — Copilot, Gemini, custom agents — included as we build them.',
            'Quarterly business reviews with your account exec, not a chatbot.',
        ],
    },
    outcomes: [
        { metric: '4 hr', label: 'critical SLA' },
        { metric: '99.99%', label: 'uptime SLA' },
        { metric: '$0', label: 'unexpected costs' },
        { metric: '200+', label: 'clients on 360' },
    ],
    proof: [
        {
            quote: 'We had three IT companies before Audcomp. Now we have one bill, one Slack channel, and zero outages.',
            name: 'Daniel V.',
            title: 'CEO, Bargain Balloons',
        },
        {
            quote: 'Their team caught and contained a phishing attack in 12 minutes. That alone paid for the year.',
            name: 'Lisa W.',
            title: 'CFO, Niagara Estate Winery',
        },
        {
            quote: 'AMS + Audcomp 360 = our IT department on speed dial. Best decision we made in 2025.',
            name: 'Rob H.',
            title: 'GM, Hamilton Logistics',
        },
    ],
    faq: [
        {
            q: 'How is this different from regular managed IT?',
            a: 'Most MSPs stop at break-fix and patches. Audcomp 360 includes AI rollouts, custom agent builds, and quarterly strategy — your IT partner is also your AI partner.',
        },
        {
            q: 'How much does it cost?',
            a: 'Starts around $99/user/mo for a basic 360 stack and scales with security tiers and AI add-ons. We\'ll send a custom quote within 48 hours of the discovery call.',
        },
        {
            q: 'Do you replace our existing IT person?',
            a: 'Not necessarily — we work great alongside in-house IT. Your team handles the day-to-day, we cover after-hours, security, M365, and AI strategy.',
        },
        {
            q: 'What\'s the contract length?',
            a: 'Standard is 12 months with a 60-day notice. Month-to-month available with a 15% premium.',
        },
    ],
    formCtaTitle: 'Get a custom Audcomp 360 quote in 48 hours.',
    formCtaSub: 'A real account exec will walk through your current setup, identify gaps, and price a tailored bundle. No high-pressure pitch.',
    successHeadline: 'Quote on its way.',
    successBody: 'An account exec will reach out within one business day with a no-obligation 360 proposal.',
};

export default function Page() { return <LandingPage cfg={cfg} />; }
