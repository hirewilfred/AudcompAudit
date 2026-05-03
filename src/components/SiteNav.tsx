'use client';

import Link from 'next/link';
import { Phone, Mail, Sparkles } from 'lucide-react';

const ORANGE = '#F97316';

interface SiteNavProps {
    /** Highlights one of the two product CTAs as the "primary" coloured button. */
    activeCta?: 'audit' | 'agents';
}

const NAV_LINKS = [
    { label: 'AI Audit',       href: '/' },
    { label: 'AI Receptionist',href: '/ai-receptionist' },
    { label: 'Custom Agents',  href: '/custom-ai-agents' },
    { label: 'AI Training',    href: '/ai-training' },
    { label: 'Audcomp 360',    href: '/audcomp-360' },
    { label: 'Case Studies',   href: '/#case-studies' },
];

export default function SiteNav({ activeCta = 'audit' }: SiteNavProps) {
    return (
        <header className="sticky top-0 z-50 bg-gray-900 shadow-lg border-b border-gray-800">
            <div className="mx-auto flex max-w-7xl items-center gap-5 px-6 py-3">

                {/* Logo */}
                <Link href="/" className="shrink-0 flex items-center">
                    <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-10 w-auto" />
                </Link>

                {/* Nav links */}
                <nav className="hidden items-center gap-5 lg:flex flex-1">
                    {NAV_LINKS.map(item => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-[13px] font-medium text-gray-300 transition-colors hover:text-white whitespace-nowrap"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* Phone + Email */}
                <div className="hidden xl:flex items-center gap-4 text-[12px] text-gray-400 shrink-0">
                    <a href="tel:905-304-1775" className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap">
                        <Phone className="h-3.5 w-3.5" /> 905-304-1775
                    </a>
                    <span className="text-gray-700">|</span>
                    <a href="mailto:info@audcomp.com" className="flex items-center gap-1.5 hover:text-white transition-colors whitespace-nowrap">
                        <Mail className="h-3.5 w-3.5" /> info@audcomp.com
                    </a>
                </div>

                {/* Two CTAs — one stays orange (brand), the other goes to the secondary product */}
                <div className="hidden lg:flex items-center gap-2 shrink-0">
                    {/* AI Audit button — primary if activeCta='audit' */}
                    <Link
                        href="/auth"
                        className="rounded-lg px-4 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 whitespace-nowrap shadow-md"
                        style={activeCta === 'audit' ? { backgroundColor: ORANGE } : { backgroundColor: '#374151' }}
                    >
                        Free AI Audit
                    </Link>
                    {/* Agent Audit button — primary if activeCta='agents' */}
                    <Link
                        href="/ai-agents/assessment"
                        className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-[12px] font-semibold text-white whitespace-nowrap shadow-md transition-all ${
                            activeCta === 'agents'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500'
                                : 'bg-gray-600 hover:bg-gray-500'
                        }`}
                    >
                        <Sparkles className="h-3 w-3" />
                        Agent Audit
                    </Link>
                </div>

            </div>
        </header>
    );
}
