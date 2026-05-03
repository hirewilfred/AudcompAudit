'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, Home, LogOut, Building2, Megaphone, Zap, Users2, ClipboardList, GraduationCap, KeyRound, Globe, Activity, Bot, Linkedin, Layout, ChevronRight } from 'lucide-react';

const SECTIONS = [
    { label: 'Command Center', items: [{ label: 'Admin Home', href: '/admin', icon: LayoutDashboard }] },
    {
        label: 'AI Audits',
        items: [
            { label: 'Audit Results', href: '/admin/audits', icon: ClipboardList },
            { label: 'Managed Experts', href: '/admin/experts', icon: UserCircle },
            { label: 'Manage Users', href: '/admin/users', icon: Users },
        ],
    },
    {
        label: 'Service',
        items: [
            { label: 'AMS Dashboard', href: '/admin/ams', icon: Building2 },
            { label: 'AMS Clients', href: '/admin/ams/clients', icon: UserCircle },
            { label: 'Service KPI Dashboard', href: '/admin/service-kpi', icon: Activity },
            { label: 'Service KPI Setup', href: '/admin/service-kpi/setup', icon: KeyRound },
        ],
    },
    {
        label: 'AI Outreach',
        items: [
            { label: 'Outreach Dashboard', href: '/admin/outreach', icon: Megaphone },
            { label: 'By Expert', href: '/admin/outreach/experts', icon: UserCircle },
            { label: 'Mission Control', href: '/admin/outreach/missions', icon: Bot },
            { label: 'LinkedIn Posts', href: '/admin/outreach/posts', icon: Linkedin },
            { label: 'Campaigns', href: '/admin/outreach/campaigns', icon: Zap },
            { label: 'Landing Pages', href: '/admin/outreach/landing-pages', icon: Layout },
            { label: 'Landing Funnel', href: '/admin/outreach/landing', icon: Globe },
            { label: 'All Leads', href: '/admin/outreach/leads', icon: Users2 },
            { label: 'Integrations', href: '/admin/outreach/integrations', icon: KeyRound },
        ],
    },
    {
        label: 'Sales Enablement',
        items: [{ label: 'Sales Training Hub', href: '/admin/sales-training', icon: GraduationCap }],
    },
];

const STORAGE_KEY = 'admin_nav_open_sections_v1';

const sectionContains = (label: string, pathname: string | null) => {
    const sec = SECTIONS.find(s => s.label === label);
    if (!sec || !pathname) return false;
    return sec.items.some(i =>
        i.href === '/admin' ? pathname === '/admin' : pathname.startsWith(i.href)
    );
};

export default function AdminNavbar() {
    const pathname = usePathname();

    // Default: only the section that owns the current route is open.
    const [open, setOpen] = useState<Record<string, boolean>>(() => {
        const seed: Record<string, boolean> = {};
        SECTIONS.forEach(s => { seed[s.label] = false; });
        return seed;
    });

    // Restore from localStorage on mount, but always force-open the active
    // section so the current page is visible even if it was collapsed last visit.
    useEffect(() => {
        let restored: Record<string, boolean> = {};
        try {
            const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
            if (raw) restored = JSON.parse(raw);
        } catch {}
        const next: Record<string, boolean> = {};
        SECTIONS.forEach(s => {
            const isOwner = sectionContains(s.label, pathname);
            next[s.label] = isOwner ? true : (restored[s.label] ?? false);
        });
        // Command Center is single-item, keep always open as a quick anchor.
        next['Command Center'] = true;
        setOpen(next);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    const toggle = (label: string) => {
        setOpen(prev => {
            const next = { ...prev, [label]: !prev[label] };
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
            return next;
        });
    };

    const isActive = (href: string) =>
        href === '/admin' ? pathname === '/admin' : (pathname?.startsWith(href) ?? false);

    return (
        <nav className="w-64 bg-white text-slate-800 min-h-screen flex flex-col fixed left-0 top-0 z-50 shadow-sm border-r border-slate-100 overflow-hidden">
            {/* deep navy accent strip + dotted texture at top */}
            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-slate-950 via-blue-950 to-transparent pointer-events-none">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(96,165,250,0.4) 1px, transparent 0)',
                        backgroundSize: '20px 20px',
                    }}
                />
            </div>

            {/* Logo */}
            <Link href="/admin" className="relative flex items-center gap-3 px-5 pt-5 pb-4 group z-10">
                <img src="/images/AUDCOMP-LOGO.png" alt="Audcomp" className="h-8 w-auto" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="font-black tracking-tight text-lg text-white group-hover:text-blue-200 transition-colors">
                    Admin <span className="text-blue-300">Portal</span>
                </span>
            </Link>

            <div className="relative z-10 h-px bg-slate-100 mx-5" />

            {/* Scrollable nav body — collapsing groups so everything fits */}
            <div className="relative z-10 flex flex-col gap-1 flex-1 overflow-y-auto px-3 py-3 nav-scroll">
                {SECTIONS.map(section => {
                    const isOwner = sectionContains(section.label, pathname);
                    const isOpen = open[section.label] ?? false;
                    const isSingle = section.items.length === 1;
                    const single = section.items[0];
                    const singleActive = isSingle && isActive(single.href);

                    if (isSingle) {
                        // Render single-item sections as a flat link (no toggle).
                        return (
                            <Link
                                key={section.label}
                                href={single.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                    singleActive
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                }`}
                            >
                                <single.icon className={`h-4 w-4 shrink-0 ${singleActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                                <span className="font-bold text-sm">{single.label}</span>
                            </Link>
                        );
                    }

                    return (
                        <div key={section.label} className="flex flex-col">
                            <button
                                onClick={() => toggle(section.label)}
                                className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg transition-colors ${
                                    isOwner ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'
                                } hover:bg-slate-50 group`}
                            >
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                                    {section.label}
                                </span>
                                <ChevronRight
                                    className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''} ${isOwner ? 'text-blue-600' : 'text-slate-400'}`}
                                />
                            </button>

                            {isOpen && (
                                <div className="flex flex-col gap-0.5 mt-0.5 mb-1.5">
                                    {section.items.map(item => {
                                        const active = isActive(item.href);
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group ${
                                                    active
                                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/30'
                                                        : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                                }`}
                                            >
                                                <item.icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                                                <span className="font-bold text-[13px]">{item.label}</span>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="relative z-10 flex flex-col gap-1 px-3 pb-4 pt-3 border-t border-slate-100">
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all group">
                    <Home className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                    <span className="font-bold text-sm">User Dashboard</span>
                </Link>
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group w-full text-left">
                    <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-600" />
                    <span className="font-bold text-sm">Logout Admin</span>
                </button>
            </div>

            <style jsx>{`
                .nav-scroll::-webkit-scrollbar { width: 6px; }
                .nav-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
                .nav-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
            `}</style>
        </nav>
    );
}
