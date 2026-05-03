import { NextResponse } from 'next/server';
import { cwFetchAll } from '@/lib/connectwise/client';
import { createClient } from '@/lib/supabase/server';
import { logSyncRun } from '@/lib/connectwise/sync';

export const runtime = 'nodejs';

interface CwBoard {
    id: number;
    name: string;
    location?: { id: number; name: string };
    department?: { id: number; name: string };
    inactiveFlag?: boolean;
}

export async function POST() {
    try {
        const result = await logSyncRun('boards', async () => {
            const supabase = await createClient();
            const boards = await cwFetchAll<CwBoard>('/service/boards', { orderBy: 'name asc' });

            // Pull existing rows so we preserve user-set monitor flags.
            const { data: existing } = await supabase
                .from('cw_monitored_boards')
                .select('board_id, monitor_today, monitor_pending_closure, monitor_sla');
            const existingMap = new Map(
                (existing ?? []).map(r => [r.board_id, r]),
            );

            const rows = boards.map(b => {
                const prev = existingMap.get(b.id);
                return {
                    board_id: b.id,
                    board_name: b.name,
                    location_id: b.location?.id ?? null,
                    location_name: b.location?.name ?? null,
                    department_id: b.department?.id ?? null,
                    department_name: b.department?.name ?? null,
                    monitor_today: prev?.monitor_today ?? false,
                    monitor_pending_closure: prev?.monitor_pending_closure ?? false,
                    monitor_sla: prev?.monitor_sla ?? false,
                    enabled: !b.inactiveFlag,
                    raw: b,
                    synced_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
            });

            if (rows.length) {
                const { error } = await supabase
                    .from('cw_monitored_boards')
                    .upsert(rows, { onConflict: 'board_id' });
                if (error) throw error;
            }
            return { count: rows.length };
        });
        return NextResponse.json({ ok: true, ...result });
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
    }
}
