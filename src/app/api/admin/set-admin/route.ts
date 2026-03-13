import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// Service role client bypasses RLS — only used for admin-only operations
function createServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    if (!url || !serviceKey) throw new Error('Supabase service role key is not configured.');
    return createClient(url, serviceKey, { auth: { persistSession: false } });
}

export async function POST(req: NextRequest) {
    try {
        // Verify the caller is an authenticated admin
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: caller } = await (supabase as any)
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (!caller?.is_admin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
        }

        const { userId, isAdmin } = await req.json();
        if (!userId || typeof isAdmin !== 'boolean') {
            return NextResponse.json({ error: 'userId and isAdmin are required.' }, { status: 400 });
        }

        // Use service role client to bypass RLS and update is_admin
        const admin = createServiceClient();
        const { error } = await admin
            .from('profiles')
            .update({ is_admin: isAdmin })
            .eq('id', userId);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('set-admin error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
