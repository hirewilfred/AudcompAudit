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

    const { full_name, email, linkedin_url, bookings_url, photo_url, is_bdm, sendInvite } = await req.json();
    if (!full_name || !email) return NextResponse.json({ error: 'full_name and email are required' }, { status: 400 });

    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // Insert expert row
    const { data: inserted, error: insertErr } = await (admin as any)
      .from('experts')
      .insert({
        full_name,
        email,
        linkedin_url: linkedin_url || null,
        bookings_url: bookings_url || null,
        photo_url: photo_url || null,
        is_bdm: !!is_bdm,
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    // Optionally invite the expert so they can log into /expert
    if (sendInvite) {
      const origin = req.headers.get('origin') || new URL(req.url).origin;
      const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${origin}/expert`,
        data: { full_name, role: 'expert' },
      });
      // Don't fail the whole request if invite already exists.
      if (inviteErr && !inviteErr.message?.toLowerCase().includes('already')) {
        console.warn('expert invite warn:', inviteErr.message);
      }
    }

    return NextResponse.json({ ok: true, expert: inserted });
  } catch (err: any) {
    console.error('create-expert error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
