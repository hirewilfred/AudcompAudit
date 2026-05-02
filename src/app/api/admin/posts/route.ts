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

export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });
    const status = new URL(req.url).searchParams.get('status');

    let query = (adminSupabase as any).from('expert_posts')
        .select('id, expert_id, platform, body, hashtags, status, scheduled_for, posted_at, posted_url, error, created_at, created_by_agent')
        .order('created_at', { ascending: false })
        .limit(200);
    if (status) query = query.eq('status', status);

    const [{ data: posts, error }, { data: experts }] = await Promise.all([
        query,
        (adminSupabase as any).from('experts').select('id, full_name, photo_url'),
    ]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const expertMap = new Map((experts ?? []).map((e: any) => [e.id, e]));
    const hydrated = (posts ?? []).map((p: any) => ({ ...p, expert: expertMap.get(p.expert_id) ?? null }));

    return NextResponse.json({ posts: hydrated });
}

// PATCH /api/admin/posts  body: { id, action: 'approve'|'decline'|'schedule', scheduled_for? }
export async function PATCH(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const { id, action, scheduled_for } = await req.json();
    if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

    let update: any = {};
    switch (action) {
        case 'approve':
            update = { status: 'approved' };
            if (scheduled_for) update.scheduled_for = scheduled_for;
            break;
        case 'decline':
            update = { status: 'declined' };
            break;
        case 'schedule':
            if (!scheduled_for) return NextResponse.json({ error: 'scheduled_for required' }, { status: 400 });
            update = { status: 'scheduled', scheduled_for };
            break;
        default:
            return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }

    const { error } = await (adminSupabase as any).from('expert_posts').update(update).eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
