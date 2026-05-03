'use client';

import { Phone, Clock, Calendar, Mic, ShieldCheck, MessageCircle } from 'lucide-react';
import LandingPage, { LandingPageConfig } from '@/components/LandingPage';

const cfg: LandingPageConfig = {
    slug: 'ai-receptionist',
    eyebrow: 'AI Receptionist',
    headlineLead: 'Never miss a call,',
    headlineAccent: 'or a customer.',
    subhead: 'A 24/7 AI receptionist that answers your business line, qualifies leads, books appointments straight into your calendar, and texts the caller a confirmation — all in your voice.',
    heroBullets: [
        'Sounds human — natural, friendly, on-brand',
        'Books straight into Google / Outlook calendars',
        'After-hours, weekends, holidays — covered',
        'Setup in 2 weeks, no IT lift',
    ],
    primaryCtaLabel: 'Book a 15-min demo',
    secondaryCtaLabel: 'See pricing',
    secondaryCtaHref: '#capture',
    problems: [
        {
            icon: Phone,
            title: '20-40% of calls go unanswered',
            body: 'Front desk is busy, after hours, on lunch — and every missed call is a lead going to your competitor.',
        },
        {
            icon: Clock,
            title: 'Voicemail tag wastes 2-3 hrs/day',
            body: 'Receptionists ping-pong messages, customers re-explain their problem twice, bookings stall for 24+ hours.',
        },
        {
            icon: Calendar,
            title: 'Manual booking creates errors',
            body: 'Double-bookings, missed timezones, calendar holes that never get filled — all from human-in-the-loop scheduling.',
        },
    ],
    solution: {
        title: 'Your AI receptionist that never sleeps.',
        bullets: [
            'Answers every call in under 2 rings, 24/7.',
            'Asks the right qualifying questions — service type, urgency, location.',
            'Books straight into your team\'s calendars with conflict checks.',
            'Texts the caller a confirmation + sends your team a Slack/Teams notification.',
            'Escalates to a human cell phone if a call says the magic word ("emergency", "urgent", "lawyer").',
            'Handover to live agents during business hours if you prefer.',
        ],
    },
    outcomes: [
        { metric: '93%', label: 'calls answered' },
        { metric: '4.6×', label: 'more bookings' },
        { metric: '$3.2k', label: 'avg monthly savings' },
        { metric: '14 days', label: 'to go live' },
    ],
    proof: [
        {
            quote: 'We were missing 30+ calls a week. The AI receptionist booked 18 appointments in the first weekend.',
            name: 'Marie L.',
            title: 'Owner, Flora Niagara Florist',
        },
        {
            quote: 'It sounds like one of our front-desk staff. Customers don\'t know it\'s AI until we tell them.',
            name: 'Dr. Singh',
            title: 'Mississauga Dental',
        },
        {
            quote: 'Best $400/mo we spend. Pays for itself in two booked jobs.',
            name: 'Carlos R.',
            title: 'Owner, Hamilton HVAC',
        },
    ],
    faq: [
        {
            q: 'Will it actually sound natural?',
            a: 'Yes — modern voice models are indistinguishable from a human in 95%+ of conversations. We let you pick a voice and tone, and you can listen to your custom build before it goes live.',
        },
        {
            q: 'What happens if it can\'t answer something?',
            a: 'It escalates to a human — either a live agent during business hours or your on-call cell after hours. Caller never hits a dead end.',
        },
        {
            q: 'How long to set up?',
            a: 'Two weeks end-to-end. Week 1 we map your services, calendar, and voice. Week 2 we test, you approve, we go live.',
        },
        {
            q: 'What does it cost?',
            a: 'Starts at $397/mo for solo / small business plans. Mid-market with multi-location and integrations runs $1,200–$2,500/mo.',
        },
    ],
    formCtaTitle: 'See your AI receptionist live in 15 minutes.',
    formCtaSub: 'Book a no-pressure demo. We\'ll show you a custom-voiced agent for your business and walk through pricing.',
    successHeadline: 'You\'re booked.',
    successBody: 'A specialist will email you within an hour with a calendar link and a sample voice clip.',
};

export default function Page() { return <LandingPage cfg={cfg} />; }
