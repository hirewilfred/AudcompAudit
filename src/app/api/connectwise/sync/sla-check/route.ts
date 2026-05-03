import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logSyncRun } from '@/lib/connectwise/sync';
import { fetchTickets, ticketToRow } from '@/lib/connectwise/tickets';

export const runtime = 'nodejs';

// Computes "minutes until breach" using requiredDate (CW's SLA target field)
// minus now. Negative = already breached.
function minutesUntilBreach(requiredDate: string | null) {
    if (!requiredDate) return null;
    return Math.round((new Date(requiredDate).getTime() - Date.now()) / 60_000);
}

export async function POST() {
    try {
        const result = await logSyncRun('sla_check', async () => {
            const supabase = await createClient();
            const { data: boards } = await supabase
                .from('cw_monitored_boards')
                .select('board_id')
                .eq('monitor_sla', true);
            const boardIds = (boards ?? []).map(b => b.board_id);
            if (!boardIds.length) return { count: 0, meta: { reason: 'no boards selected' } };

            // Pull all currently-open tickets on monitored boards.
            const tickets = await fetchTickets({
                boardIds,
                conditions: ['closedFlag=false'],
            });
            const rows = tickets.map(t => {
                const row = ticketToRow(t);
                row.minutes_until_breach = minutesUntilBreach(row.required_date);
                return row;
            });
            if (rows.length) {
                const { error } = await supabase.from('cw_tickets').upsert(rows, { onConflict: 'id' });
                if (error) throw error;
            }
            const breached = rows.filter(r => (r.minutes_until_breach ?? 1) < 0).length;
            const atRisk = rows.filter(r => {
                const m = r.minutes_until_breach;
                return m !== null && m >= 0 && m < 60;
            }).length;
            return { count: rows.length, meta: { boardIds, breached, atRisk } };
        });
        return NextResponse.json({ ok: true, ...result });
    } catch (err) {
        return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 502 });
    }
}
