import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: caller } = await (supabase as any)
      .from('profiles').select('is_admin').eq('id', session.user.id).single();
    if (!caller?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const origin = req.headers.get('origin') || new URL(req.url).origin;
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth?mode=login`,
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
