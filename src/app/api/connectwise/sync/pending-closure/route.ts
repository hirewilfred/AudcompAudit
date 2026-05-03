import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logSyncRun } from '@/lib/connectwise/sync';
import { fetchTickets, ticketToRow } from '@/lib/connectwise/tickets';

export const runtime = 'nodejs';

const PENDING_STATUS_NAMES = (process.env.CW_PENDING_CLOSURE_STATUSES || 'Pending Closure')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

export async function POST() {
    try {
        const result = await logSyncRun('pending_closure', async () => {
            const supabase = await createClient();
            const { data: boards } = await supabase
                .from('cw_monitored_boards')
                .select('board_id')
                .eq('monitor_pending_closure', true);
            const boardIds = (boards ?? []).map(b => b.board_id);
            if (!boardIds.length) return { count: 0, meta: { reason: 'no boards selected' } };

            const statusClause = PENDING_STATUS_NAMES
                .map(n => `status/name="${n}"`)
                .join(' or ');
            const tickets = await fetchTickets({
                boardIds,
                conditions: [`(${statusClause})`, 'closedFlag=false'],
            });
            const rows = tickets.map(ticketToRow);
            if (rows.length) {
                const { error } = await supabase.from('cw_tickets').upsert(rows, { onConflict: 'id' });
                if (error) throw error;
            }
            return { count: rows.length, meta: { boardIds, statuses: PENDING_STATUS_NAMES } };
        });
        return NextResponse.json({ ok: true, ...result });
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
    }
}
