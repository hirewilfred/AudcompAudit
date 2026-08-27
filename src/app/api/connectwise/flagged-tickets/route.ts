import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Thresholds are env-tunable, matching CW_PENDING_CLOSURE_STATUSES.
const FLAG_BOARD_NAME = process.env.CW_FLAG_BOARD_NAME || 'Help Desk';
const FLAG_BOARD_AGE_DAYS = Number(process.env.CW_FLAG_BOARD_AGE_DAYS || 3);
const FLAG_TRIAGE_STATUS = process.env.CW_FLAG_TRIAGE_STATUS || 'Triaged';
const FLAG_TRIAGE_HOURS = Number(process.env.CW_FLAG_TRIAGE_HOURS || 3);

// Flags are a "needs action" list, so tickets already on their way out are not
// flagged. Closed is handled by date_closed; this drops pending closure too.
const PENDING_STATUS_NAMES = (process.env.CW_PENDING_CLOSURE_STATUSES || 'Pending Closure')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
const PENDING_STATUS_LIST = `(${PENDING_STATUS_NAMES.map(s => `"${s.replace(/"/g, '""')}"`).join(',')})`;

interface FlaggedTicket {
    id: number;
    summary: string | null;
    status_name: string | null;
    board_name: string | null;
    priority_name: string | null;
    priority_sort: number | null;
    company_name: string | null;
    contact_name: string | null;
    resources: string | null;
    age_days: number | null;
    actual_hours: number | null;
    required_date: string | null;
    minutes_until_breach: number | null;
    date_entered: string | null;
    status_since: string | null;
}

export async function GET() {
    const supabase = await createClient();

    const boardCutoff = new Date(Date.now() - FLAG_BOARD_AGE_DAYS * 86_400_000).toISOString();
    const triageCutoff = new Date(Date.now() - FLAG_TRIAGE_HOURS * 3_600_000).toISOString();

    // Two independent rules, so two queries rather than one OR — a ticket can
    // breach both and must then carry both reasons.
    // `not.in` evaluates to NULL for a null status_name and PostgREST drops
    // those rows, so keep them explicitly — no status is not "pending closure".
    const notPending = `status_name.is.null,status_name.not.in.${PENDING_STATUS_LIST}`;

    const [staleBoard, staleTriage] = await Promise.all([
        supabase
            .from('cw_tickets')
            .select('*')
            .is('date_closed', null)
            .eq('board_name', FLAG_BOARD_NAME)
            .or(notPending)
            .lt('date_entered', boardCutoff),
        supabase
            .from('cw_tickets')
            .select('*')
            .is('date_closed', null)
            .eq('status_name', FLAG_TRIAGE_STATUS)
            .lt('status_since', triageCutoff),
    ]);

    if (staleBoard.error) {
        return NextResponse.json({ ok: false, error: staleBoard.error.message }, { status: 500 });
    }
    if (staleTriage.error) {
        return NextResponse.json({ ok: false, error: staleTriage.error.message }, { status: 500 });
    }

    const flagsById = new Map<number, { ticket: FlaggedTicket; flags: string[] }>();
    const add = (rows: FlaggedTicket[], flag: string) => {
        for (const t of rows) {
            const cur = flagsById.get(t.id) ?? { ticket: t, flags: [] };
            cur.flags.push(flag);
            flagsById.set(t.id, cur);
        }
    };
    add((staleBoard.data ?? []) as FlaggedTicket[], 'helpdesk_stale');
    add((staleTriage.data ?? []) as FlaggedTicket[], 'triaged_stale');

    const tickets = [...flagsById.values()]
        .map(v => ({ ...v.ticket, flags: v.flags }))
        // Most flags first, then oldest.
        .sort((a, b) =>
            b.flags.length - a.flags.length ||
            (a.date_entered ?? '').localeCompare(b.date_entered ?? ''));

    return NextResponse.json({
        ok: true,
        rules: {
            helpdesk_stale: { board: FLAG_BOARD_NAME, days: FLAG_BOARD_AGE_DAYS },
            triaged_stale: { status: FLAG_TRIAGE_STATUS, hours: FLAG_TRIAGE_HOURS },
        },
        tickets,
    });
}
