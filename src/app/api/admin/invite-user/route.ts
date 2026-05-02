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

    const { email, full_name, organization, phone, role } = await req.json();
    if (!email) return NextResponse.json({ error: 'email is required' }, { status: 400 });
    const userRole = role === 'admin' ? 'admin' : 'customer';

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Build the redirect URL the invitee will land on after clicking the email link
    const origin = req.headers.get('origin') || new URL(req.url).origin;
    const redirectTo = userRole === 'admin' ? `${origin}/admin` : `${origin}/survey`;

    // Use Supabase invite flow — sends email with a magic link to set password
    const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo,
      data: { full_name, organization },
    });

    if (inviteErr) {
      // Fallback: if user already exists, send a password reset instead so they can re-onboard.
      if (inviteErr.message?.toLowerCase().includes('already')) {
        await admin.auth.admin.generateLink({ type: 'recovery', email });
        return NextResponse.json({ ok: true, message: 'User already existed — sent a password-reset link instead.' });
      }
      throw inviteErr;
    }

    const newUserId = invited?.user?.id;
    if (newUserId) {
      // Upsert profile row so the user lands with their name/org pre-filled
      await (admin as any).from('profiles').upsert({
        id: newUserId,
        email,
        full_name: full_name ?? null,
        organization: organization ?? null,
        phone: phone ?? null,
        is_admin: userRole === 'admin',
        has_completed_audit: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });
    }

    return NextResponse.json({ ok: true, userId: newUserId, role: userRole });
  } catch (err: any) {
    console.error('invite-user error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
