import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sampleAllTickets } from '@/lib/connectwise/sampleData';

export const runtime = 'nodejs';

interface TicketLike {
    id: number;
    assigned_resource: string | null;
    resources: string | null;
    date_entered: string | null;
    date_closed: string | null;
    actual_hours: number | null;
    board_id?: number | null;
}

interface TechRow {
    tech: string;
    assigned_to_me: number;
    touched: number;
    closed_by_me: number;
    open: number;
    avg_hours: number;
    closure_rate: number;
}

function splitResources(s: string | null): string[] {
    if (!s) return [];
    return s.split(/[,;]+/).map(t => t.trim()).filter(Boolean);
}

function rollup(tickets: TicketLike[], sinceMs: number): TechRow[] {
    const techs = new Map<string, { assigned: TicketLike[]; touched: Set<number>; closed: TicketLike[]; open: number; hoursSum: number; hoursCount: number }>();

    const ensure = (t: string) => {
        if (!techs.has(t)) techs.set(t, { assigned: [], touched: new Set(), closed: [], open: 0, hoursSum: 0, hoursCount: 0 });
        return techs.get(t)!;
    };

    for (const t of tickets) {
        const enteredMs = t.date_entered ? new Date(t.date_entered).getTime() : 0;
        const closedMs = t.date_closed ? new Date(t.date_closed).getTime() : 0;
        const inWindowEntered = enteredMs >= sinceMs;
        const inWindowClosed = closedMs >= sinceMs;

        const assigned = (t.assigned_resource ?? '').trim();
        if (assigned && inWindowEntered) {
            const row = ensure(assigned);
            row.assigned.push(t);
            if (!t.date_closed) row.open += 1;
            if (t.actual_hours != null) { row.hoursSum += t.actual_hours; row.hoursCount += 1; }
        }

        for (const r of splitResources(t.resources)) {
            if (inWindowEntered || inWindowClosed) {
                ensure(r).touched.add(t.id);
            }
        }

        if (assigned && t.date_closed && inWindowClosed) {
            ensure(assigned).closed.push(t);
        }
    }

    const rows: TechRow[] = [];
    for (const [tech, d] of techs.entries()) {
        const assignedCount = d.assigned.length;
        const closedCount = d.closed.length;
        rows.push({
            tech,
            assigned_to_me: assignedCount,
            touched: d.touched.size,
            closed_by_me: closedCount,
            open: d.open,
            avg_hours: d.hoursCount ? +(d.hoursSum / d.hoursCount).toFixed(2) : 0,
            closure_rate: assignedCount ? Math.round((closedCount / assignedCount) * 100) : 0,
        });
    }
    return rows.sort((a, b) => b.assigned_to_me - a.assigned_to_me);
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const days = Math.max(1, parseInt(url.searchParams.get('days') || '7', 10));
    const sinceMs = Date.now() - days * 86_400_000;
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('cw_tickets')
        .select('id, assigned_resource, resources, date_entered, date_closed, actual_hours, board_id')
        .or(`date_entered.gte.${new Date(sinceMs).toISOString()},date_closed.gte.${new Date(sinceMs).toISOString()}`);

    const allowSample = process.env.NODE_ENV !== 'production';
    if (error) {
        if (allowSample) {
            return NextResponse.json({ ok: true, sample: true, days, rows: rollup(sampleAllTickets(), sinceMs), warning: error.message });
        }
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    if (!data || data.length === 0) {
        if (allowSample) {
            return NextResponse.json({ ok: true, sample: true, days, rows: rollup(sampleAllTickets(), sinceMs) });
        }
        return NextResponse.json({ ok: true, sample: false, days, rows: [] });
    }
    return NextResponse.json({ ok: true, sample: false, days, rows: rollup(data, sinceMs) });
}
