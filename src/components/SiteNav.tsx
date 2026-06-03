'use client';

import Link from 'next/link';

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
        <header className="sticky top-0 z-50 border-b hairline bg-white/72 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto flex h-12 max-w-[1024px] items-center gap-6 px-6">

                <Link href="/" className="shrink-0 flex items-center">
                    <img src="/images/AUDCOMP-LOGO.png" alt="AUDCOMP" className="h-5 w-auto opacity-90" />
                </Link>

                <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
                    {NAV_LINKS.map(item => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="text-[12px] font-normal text-[#1d1d1f]/85 hover:text-[#1d1d1f] transition-colors whitespace-nowrap"
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="hidden lg:flex items-center gap-2 shrink-0">
                    <Link
                        href="/auth"
                        className={`inline-flex items-center rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap ${
                            activeCta === 'audit'
                                ? 'bg-[#f97316] text-white hover:bg-[#c2410c]'
                                : 'bg-[#1d1d1f]/[0.06] text-[#1d1d1f] hover:bg-[#1d1d1f]/[0.1]'
                        }`}
                    >
                        Free AI Audit
                    </Link>
                    <Link
                        href="/ai-agents/assessment"
                        className={`inline-flex items-center rounded-full px-4 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap ${
                            activeCta === 'agents'
                                ? 'bg-[#1d1d1f] text-white hover:bg-[#2d2d30]'
                                : 'bg-[#1d1d1f]/[0.06] text-[#1d1d1f] hover:bg-[#1d1d1f]/[0.1]'
                        }`}
                    >
                        Agent Audit
                    </Link>
                </div>

            </div>
        </header>
    );
}
