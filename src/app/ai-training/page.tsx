'use client';

import { GraduationCap, Users, BookOpen, Lightbulb } from 'lucide-react';
import LandingPage, { LandingPageConfig } from '@/components/LandingPage';

const cfg: LandingPageConfig = {
    slug: 'ai-training',
    eyebrow: 'AI Training & Workshops',
    headlineLead: 'Get your team using AI',
    headlineAccent: 'this week, not next quarter.',
    subhead: 'Half-day workshops that turn skeptical staff into confident AI users — without the hype, without the fluff. Live, in-person or virtual, taught by Audcomp engineers who actually ship AI for a living.',
    heroBullets: [
        'Workshop, not lecture — every staff member ships a real prompt',
        'Tailored to your industry and tools (M365, Google, HubSpot)',
        'Recordings + cheat sheets included',
        'Group rates for 5+ seats',
    ],
    primaryCtaLabel: 'Book a workshop',
    secondaryCtaLabel: 'Download the curriculum',
    secondaryCtaHref: '#capture',
    problems: [
        {
            icon: Users,
            title: 'Your team bought Copilot — and barely uses it',
            body: 'Most enterprise AI rollouts hit 12% adoption. Tools sit unused because nobody showed them how to apply it to their actual job.',
        },
        {
            icon: BookOpen,
            title: 'Online courses are too generic',
            body: 'Generic prompts taught by influencers don\'t map to your invoices, your contracts, your tickets. Staff watch the course, then forget.',
        },
        {
            icon: Lightbulb,
            title: 'You can\'t hire your way out of this',
            body: 'You don\'t need an AI specialist — you need every existing employee 20% more productive. Training is the fastest path.',
        },
    ],
    solution: {
        title: 'Hands-on workshops, taught by people who build AI agents for a living.',
        bullets: [
            'Group Workshop (4 hours) — up to 30 staff, your office or remote, $149-$299/person.',
            'Private Company Session (half-day to 2-day) — built around your stack, your workflows, your industry. $1,500–$6,000.',
            'Self-paced course — 8 modules, 60-second videos, takeaway prompts library. $199-$499/seat.',
            'Every workshop ends with each attendee shipping a real prompt that solves a real problem in their job.',
            '30-day Slack support for workshop alumni — ask questions as the AI evolves.',
        ],
    },
    outcomes: [
        { metric: '4 hrs', label: 'average format' },
        { metric: '94%', label: 'attendees adopt' },
        { metric: '6.2 hrs/wk', label: 'saved per attendee' },
        { metric: '30+', label: 'companies trained' },
    ],
    proof: [
        {
            quote: 'Best $4K we spent all year. Our claims team is 30% faster two weeks after the workshop.',
            name: 'Janet C.',
            title: 'VP Ops, Niagara Insurance',
        },
        {
            quote: 'Audcomp\'s engineers actually use this stuff. The training felt like pair-programming with experts.',
            name: 'Mike T.',
            title: 'IT Director, Hamilton Manufacturing',
        },
        {
            quote: 'I was the AI skeptic on the team. After 2 hours I had built a workflow that saved my afternoon.',
            name: 'Sara B.',
            title: 'Office Manager, Mississauga Dental',
        },
    ],
    faq: [
        {
            q: 'Who teaches it?',
            a: 'Audcomp engineers — the same people who build production AI agents for our clients. Not marketers, not influencers.',
        },
        {
            q: 'On-site or virtual?',
            a: 'Both. Most clients prefer half-day on-site for first session, follow-ups virtual. Travel surcharge outside the GTA.',
        },
        {
            q: 'What stack do you teach?',
            a: 'Whatever your team uses — Microsoft Copilot, ChatGPT, Claude, Gemini, perplexity. We bring the prompts, you bring the laptops.',
        },
        {
            q: 'What if my team is resistant?',
            a: 'That\'s our specialty. The first hour is built specifically for skeptics — no hype, just real numbers from clients in your industry.',
        },
    ],
    formCtaTitle: 'Tell us about your team — we\'ll send a tailored agenda.',
    formCtaSub: 'No commitment. We\'ll route you to a senior engineer who can scope a workshop for your industry.',
    successHeadline: 'On its way.',
    successBody: 'Look for a tailored workshop agenda + 3 sample dates in your inbox within an hour.',
};

export default function Page() { return <LandingPage cfg={cfg} />; }
