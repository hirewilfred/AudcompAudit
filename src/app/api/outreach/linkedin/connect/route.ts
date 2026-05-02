import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { saveIntegration } from '@/lib/outreach/integrations';

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false as const, status: 401, userId: null };
    const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', session.user.id).single() as any;
    if (!profile?.is_admin) return { ok: false as const, status: 403, userId: null };
    return { ok: true as const, userId: session.user.id };
}

// POST /api/outreach/linkedin/connect
// Body: { expertId: string; cookie: string }
//
// Stores the expert's LinkedIn `li_at` session cookie in the integrations vault
// (provider='linkedin_oauth', scope='per_expert'). PhantomBuster phantoms read
// it through getIntegrationKey({ provider: 'linkedin_oauth', expertId }).
//
// Note: this is the cookie-paste flow PhantomBuster officially supports. Full
// OAuth via LinkedIn's API requires their Marketing Developer Platform approval
// and is out of scope for the MVP.
export async function POST(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const { expertId, cookie } = await req.json();
    if (!expertId || !cookie?.trim()) {
        return NextResponse.json({ error: 'expertId and cookie required' }, { status: 400 });
    }

    try {
        const row = await saveIntegration({
            provider: 'linkedin_oauth',
            label: `LinkedIn — expert ${expertId.slice(0, 8)}`,
            rawKey: cookie.trim(),
            scope: 'per_expert',
            expertId,
            createdBy: auth.userId,
        });
        return NextResponse.json({ ok: true, integration: row });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
