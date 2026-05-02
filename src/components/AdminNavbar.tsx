'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, Home, LogOut, Building2, Megaphone, Zap, Users2, ClipboardList, GraduationCap, KeyRound, Globe, Activity, Bot, Linkedin } from 'lucide-react';

export default function AdminNavbar() {
    const pathname = usePathname();

    const sections = [
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
            label: 'AMS Portal',
            items: [
                { label: 'AMS Dashboard', href: '/admin/ams', icon: Building2 },
                { label: 'AMS Clients', href: '/admin/ams/clients', icon: UserCircle },
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
                { label: 'Landing Funnel', href: '/admin/outreach/landing', icon: Globe },
                { label: 'All Leads', href: '/admin/outreach/leads', icon: Users2 },
                { label: 'Integrations', href: '/admin/outreach/integrations', icon: KeyRound },
            ],
        },
        {
            label: 'Sales Enablement',
            items: [{ label: 'Sales Training Hub', href: '/admin/sales-training', icon: GraduationCap }],
        },
        {
            label: 'Service KPI',
            items: [{ label: 'Service Dashboard', href: '/admin/service-kpi', icon: Activity }],
        },
    ];

    const isActive = (href: string) =>
        href === '/admin' ? pathname === '/admin' : (pathname?.startsWith(href) ?? false);

    return (
        <nav className="w-64 bg-white text-slate-800 min-h-screen p-5 flex flex-col gap-5 fixed left-0 top-0 z-50 shadow-sm border-r border-slate-100 overflow-hidden">
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
            <Link href="/admin" className="relative flex items-center gap-3 px-2 py-2 group z-10">
                <img src="/images/AUDCOMP-LOGO.png" alt="Audcomp" className="h-8 w-auto" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="font-black tracking-tight text-lg text-white group-hover:text-blue-200 transition-colors">
                    Admin <span className="text-blue-300">Portal</span>
                </span>
            </Link>

            <div className="relative z-10 h-px bg-slate-100" />

            <div className="relative z-10 flex flex-col gap-4 flex-1">
                {sections.map(section => (
                    <div key={section.label} className="flex flex-col gap-0.5">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 px-3 mb-1">{section.label}</p>
                        {section.items.map(item => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                        active
                                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                                            : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                                    }`}
                                >
                                    <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                                    <span className="font-bold text-sm">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>

            <div className="relative z-10 flex flex-col gap-1 pt-4 border-t border-slate-100">
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-all group">
                    <Home className="h-4 w-4 text-slate-400 group-hover:text-blue-600" />
                    <span className="font-bold text-sm">User Dashboard</span>
                </Link>
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all group w-full text-left">
                    <LogOut className="h-4 w-4 text-slate-400 group-hover:text-red-600" />
                    <span className="font-bold text-sm">Logout Admin</span>
                </button>
            </div>
        </nav>
    );
}
