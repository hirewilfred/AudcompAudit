import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('cw_monitored_boards')
        .select('*')
        .order('board_name', { ascending: true });
    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, boards: data ?? [] });
}

export async function PATCH(req: NextRequest) {
    const body = await req.json().catch(() => null) as
        | { board_id: number; monitor_today?: boolean; monitor_pending_closure?: boolean; monitor_sla?: boolean }
        | null;
    if (!body?.board_id) {
        return NextResponse.json({ ok: false, error: 'board_id required' }, { status: 400 });
    }
    const supabase = await createClient();
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.monitor_today === 'boolean') patch.monitor_today = body.monitor_today;
    if (typeof body.monitor_pending_closure === 'boolean') patch.monitor_pending_closure = body.monitor_pending_closure;
    if (typeof body.monitor_sla === 'boolean') patch.monitor_sla = body.monitor_sla;

    const { data, error } = await supabase
        .from('cw_monitored_boards')
        .update(patch)
        .eq('board_id', body.board_id)
        .select('*')
        .single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, board: data });
}
