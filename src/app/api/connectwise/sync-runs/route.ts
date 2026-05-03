import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const scope = url.searchParams.get('scope');
    const supabase = await createClient();
    let q = supabase
        .from('cw_sync_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);
    if (scope) q = q.eq('scope', scope);
    const { data, error } = await q;
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, runs: data ?? [] });
}
