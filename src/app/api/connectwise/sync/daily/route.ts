import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logSyncRun } from '@/lib/connectwise/sync';
import { fetchTickets, ticketToRow, startOfTodayUtc } from '@/lib/connectwise/tickets';
import { authorizeSync } from '@/lib/connectwise/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    const unauth = await authorizeSync(req);
    if (unauth) return unauth;
    try {
        const result = await logSyncRun('daily', async () => {
            const supabase = createAdminClient();
            const { data: boards } = await supabase
                .from('cw_monitored_boards')
                .select('board_id')
                .eq('monitor_today', true);
            const boardIds = (boards ?? []).map(b => b.board_id);
            if (!boardIds.length) return { count: 0, meta: { reason: 'no boards selected' } };

            const tickets = await fetchTickets({
                boardIds,
                conditions: [`_info/dateEntered >= ${startOfTodayUtc()}`],
            });
            const rows = tickets.map(ticketToRow);
            if (rows.length) {
                const { error } = await supabase.from('cw_tickets').upsert(rows, { onConflict: 'id' });
                if (error) throw error;
            }
            return { count: rows.length, meta: { boardIds } };
        });
        return NextResponse.json(result);
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
    }
}

export const GET = POST;
