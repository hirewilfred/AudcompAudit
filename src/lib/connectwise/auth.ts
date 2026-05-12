import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Sync endpoints accept two forms of auth:
//   1. Bearer token matching CRON_SECRET (Vercel Cron sets `Authorization: Bearer $CRON_SECRET`)
//   2. An authenticated staff/admin user session
//
// Returns null on success, or a NextResponse to short-circuit the route.
export async function authorizeSync(req: NextRequest): Promise<NextResponse | null> {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const auth = req.headers.get('authorization') ?? '';
        const provided = auth.startsWith('Bearer ') ? auth.slice(7) : req.headers.get('x-cron-secret');
        if (provided && provided === cronSecret) return null;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as unknown as {
        from: (t: string) => { select: (c: string) => { eq: (k: string, v: string) => { single: () => Promise<{ data: { is_admin?: boolean; is_staff?: boolean } | null }> } } }
    })
        .from('profiles')
        .select('is_admin, is_staff')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin && !profile?.is_staff) {
        return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    return null;
}
