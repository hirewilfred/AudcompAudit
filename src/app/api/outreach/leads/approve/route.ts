import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

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

// POST /api/outreach/leads/approve
// Body: { leadIds: string[]; action: 'approve'|'decline' }
export async function POST(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const { leadIds, action } = await req.json();
    if (!Array.isArray(leadIds) || leadIds.length === 0) {
        return NextResponse.json({ error: 'leadIds required' }, { status: 400 });
    }
    if (action !== 'approve' && action !== 'decline') {
        return NextResponse.json({ error: 'action must be approve|decline' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'declined';

    const { data, error } = await (adminSupabase as any)
        .from('outreach_leads')
        .update({ approval_status: newStatus })
        .in('id', leadIds)
        .eq('approval_status', 'pending_review') // only flip pending rows
        .select('id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ updated: (data ?? []).length, ids: (data ?? []).map((r: any) => r.id) });
}
