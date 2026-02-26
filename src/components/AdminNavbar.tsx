'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, Settings, Home, LogOut } from 'lucide-react';

export default function AdminNavbar() {
    const pathname = usePathname();

    const navItems = [
        { label: 'Admin Home', href: '/admin', icon: LayoutDashboard },
        { label: 'Manage Experts', href: '/admin/experts', icon: Users },
        { label: 'Manage Users', href: '/admin/users', icon: UserCircle },
        { label: 'System Settings', href: '/admin/settings', icon: Settings },
    ];

    return (
        <nav className="w-64 bg-slate-900 text-white min-h-screen p-6 flex flex-col gap-8 fixed left-0 top-0 z-50 shadow-2xl">
            <div className="flex items-center gap-3 px-2">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="font-black text-xs">A</span>
                </div>
                <span className="font-black tracking-tight text-xl uppercase">Admin <span className="text-blue-500">Portal</span></span>
            </div>

            <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 group ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`} />
                            <span className="font-black text-sm uppercase tracking-widest">{item.label}</span>
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto flex flex-col gap-2">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group"
                >
                    <Home className="h-5 w-5 text-slate-500 group-hover:text-blue-400" />
                    <span className="font-black text-sm uppercase tracking-widest">User Dashboard</span>
                </Link>
                <button
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group w-full text-left"
                >
                    <LogOut className="h-5 w-5 text-slate-500 group-hover:text-red-400" />
                    <span className="font-black text-sm uppercase tracking-widest">Logout Admin</span>
                </button>
            </div>
        </nav>
    );
}
