'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, Home, LogOut, Building2, Megaphone, Zap, Users2, ClipboardList } from 'lucide-react';

export default function AdminNavbar() {
    const pathname = usePathname();

    const sections = [
        {
            label: 'Command Center',
            items: [
                { label: 'Admin Home', href: '/admin', icon: LayoutDashboard },
            ]
        },
        {
            label: 'AI Audits',
            items: [
                { label: 'Audit Results', href: '/admin/audits', icon: ClipboardList },
                { label: 'Managed Experts', href: '/admin/experts', icon: UserCircle },
                { label: 'Manage Users', href: '/admin/users', icon: Users },
            ]
        },
        {
            label: 'AMS Portal',
            items: [
                { label: 'AMS Dashboard', href: '/admin/ams', icon: Building2 },
                { label: 'AMS Clients', href: '/admin/ams/clients', icon: UserCircle },
            ]
        },
        {
            label: 'AI Outreach',
            items: [
                { label: 'Outreach Dashboard', href: '/admin/outreach', icon: Megaphone },
                { label: 'Campaigns', href: '/admin/outreach/campaigns', icon: Zap },
                { label: 'All Leads', href: '/admin/outreach/leads', icon: Users2 },
            ]
        },
    ];

    const isActive = (href: string) =>
        href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

    return (
        <nav className="w-64 bg-[#060C1C] text-white min-h-screen p-5 flex flex-col gap-5 fixed left-0 top-0 z-50 shadow-2xl border-r border-white/5">
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-3 px-2 py-2 group">
                <img src="/images/AUDCOMP-LOGO.png" alt="Audcomp" className="h-8 w-auto" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                <span className="font-black tracking-tight text-lg text-white group-hover:text-blue-400 transition-colors">
                    Admin <span className="text-blue-500">Portal</span>
                </span>
            </Link>

            <div className="h-px bg-white/5" />

            {/* Nav sections */}
            <div className="flex flex-col gap-4 flex-1">
                {sections.map(section => (
                    <div key={section.label} className="flex flex-col gap-0.5">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 px-3 mb-1">{section.label}</p>
                        {section.items.map(item => {
                            const active = isActive(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                                        active
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <item.icon className={`h-4 w-4 shrink-0 ${active ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                                    <span className="font-bold text-sm">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-1 pt-4 border-t border-white/5">
                <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group">
                    <Home className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                    <span className="font-bold text-sm">User Dashboard</span>
                </Link>
                <button className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group w-full text-left">
                    <LogOut className="h-4 w-4 text-slate-500 group-hover:text-red-400" />
                    <span className="font-bold text-sm">Logout Admin</span>
                </button>
            </div>
        </nav>
    );
}
