import { NextRequest, NextResponse } from 'next/server';
import { cwFetchAll } from '@/lib/connectwise/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { logSyncRun } from '@/lib/connectwise/sync';
import { authorizeSync } from '@/lib/connectwise/auth';

export const runtime = 'nodejs';

interface CwDepartment {
    id: number;
    name: string;
    location?: { id: number; name: string };
}

export async function POST(req: NextRequest) {
    const unauth = await authorizeSync(req);
    if (unauth) return unauth;
    try {
        const result = await logSyncRun('departments', async () => {
            const supabase = createAdminClient();
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
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
    }
}

export const GET = POST;
