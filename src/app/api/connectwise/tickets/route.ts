import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const PENDING_STATUS_NAMES = (process.env.CW_PENDING_CLOSURE_STATUSES || 'Pending Closure')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope') ?? 'today';
    const supabase = await createClient();

    let q = supabase.from('cw_tickets').select('*');

    if (scope === 'today') {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        q = q.gte('date_entered', start.toISOString()).order('date_entered', { ascending: false });
    } else if (scope === 'pending') {
        q = q.in('status_name', PENDING_STATUS_NAMES).order('date_entered', { ascending: false });
    } else if (scope === 'sla') {
        q = q.not('minutes_until_breach', 'is', null).order('minutes_until_breach', { ascending: true });
    } else if (scope === 'open') {
        q = q.is('date_closed', null).order('date_entered', { ascending: false });
    } else {
        q = q.order('date_entered', { ascending: false }).limit(500);
    }

    const boardParam = url.searchParams.get('boards');
    if (boardParam) {
        const ids = boardParam.split(',').map(s => parseInt(s, 10)).filter(Number.isFinite);
        if (ids.length) q = q.in('board_id', ids);
    }

    const { data, error } = await q;
    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, tickets: data ?? [] });
}
