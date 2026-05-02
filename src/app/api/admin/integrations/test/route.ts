import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { instantlyAdapter } from '@/lib/outreach/providers/instantly';
import { apifyAdapter } from '@/lib/outreach/providers/apify';
import { phantombusterAdapter } from '@/lib/outreach/providers/phantombuster';

const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false as const, status: 401 };
    const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', session.user.id).single() as any;
    if (!profile?.is_admin) return { ok: false as const, status: 403 };
    return { ok: true as const };
}

// POST /api/admin/integrations/test
// Body: { id: string }   → tests the integration's credentials live.
export async function POST(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const { data: row, error } = await (adminSupabase as any)
        .from('integrations')
        .select('id, provider')
        .eq('id', id)
        .maybeSingle();
    if (error || !row) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    let result: { ok: boolean; error?: string };
    switch (row.provider) {
        case 'instantly':
            result = await instantlyAdapter.testConnection();
            break;
        case 'apify':
            result = await apifyAdapter.testConnection();
            break;
        case 'phantombuster':
            result = await phantombusterAdapter.testConnection();
            break;
        default:
            result = { ok: false, error: `Test not implemented for provider "${row.provider}"` };
    }

    await (adminSupabase as any).from('integrations').update({
        last_test_at: new Date().toISOString(),
        last_test_ok: result.ok,
        last_test_error: result.error ?? null,
    }).eq('id', id);

    return NextResponse.json(result);
}
