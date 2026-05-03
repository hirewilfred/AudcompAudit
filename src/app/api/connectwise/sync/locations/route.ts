import { NextResponse } from 'next/server';
import { cwFetchAll } from '@/lib/connectwise/client';
import { createClient } from '@/lib/supabase/server';
import { logSyncRun } from '@/lib/connectwise/sync';

export const runtime = 'nodejs';

interface CwLocation { id: number; name: string }

export async function POST() {
    try {
        const result = await logSyncRun('locations', async () => {
            const supabase = await createClient();
            const locs = await cwFetchAll<CwLocation>('/system/locations', { orderBy: 'name asc' });
            const rows = locs.map(l => ({
                id: l.id,
                name: l.name,
                raw: l,
                synced_at: new Date().toISOString(),
            }));
            if (rows.length) {
                const { error } = await supabase.from('cw_locations').upsert(rows, { onConflict: 'id' });
                if (error) throw error;
            }
            return { count: rows.length };
        });
        return NextResponse.json({ ok: true, ...result });
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
    }
}
