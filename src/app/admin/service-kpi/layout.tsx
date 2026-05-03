import AdminNavbar from '@/components/AdminNavbar';

export default function ServiceKpiLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-slate-50">
            <AdminNavbar />
            <div className="ml-64">{children}</div>
        </div>
    );
}
