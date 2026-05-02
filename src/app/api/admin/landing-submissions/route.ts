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

    const slug = new URL(req.url).searchParams.get('slug');

    let query = (adminSupabase as any).from('landing_page_submissions')
        .select('id, landing_page_slug, email, full_name, organization, phone, referrer, utm_source, utm_medium, utm_campaign, captured_at, assigned_expert_id, audit_user_id')
        .order('captured_at', { ascending: false })
        .limit(200);

    if (slug) query = query.eq('landing_page_slug', slug);

    const [{ data: rows, error }, { data: experts }] = await Promise.all([
        query,
        (adminSupabase as any).from('experts').select('id, full_name, photo_url'),
    ]);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const expertMap = new Map((experts ?? []).map((e: any) => [e.id, e]));
    const hydrated = (rows ?? []).map((r: any) => ({
        ...r,
        expert: r.assigned_expert_id ? expertMap.get(r.assigned_expert_id) ?? null : null,
    }));

    // Per-slug counts for the page filter chips
    const counts: Record<string, number> = {};
    for (const r of (rows ?? [])) counts[r.landing_page_slug] = (counts[r.landing_page_slug] ?? 0) + 1;

    return NextResponse.json({ submissions: hydrated, counts });
}
