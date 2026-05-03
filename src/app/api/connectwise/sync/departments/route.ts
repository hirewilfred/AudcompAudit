import { NextResponse } from 'next/server';
import { cwFetchAll } from '@/lib/connectwise/client';
import { createClient } from '@/lib/supabase/server';
import { logSyncRun } from '@/lib/connectwise/sync';

export const runtime = 'nodejs';

interface CwDepartment {
    id: number;
    name: string;
    location?: { id: number; name: string };
}

export async function POST() {
    try {
        const result = await logSyncRun('departments', async () => {
            const supabase = await createClient();
            const deps = await cwFetchAll<CwDepartment>('/system/departments', { orderBy: 'name asc' });
            const rows = deps.map(d => ({
                id: d.id,
                name: d.name,
                location_id: d.location?.id ?? null,
                raw: d,
                synced_at: new Date().toISOString(),
            }));
            if (rows.length) {
                const { error } = await supabase.from('cw_departments').upsert(rows, { onConflict: 'id' });
                if (error) throw error;
            }
            return { count: rows.length };
        });
        return NextResponse.json({ ok: true, ...result });
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
    }
}
