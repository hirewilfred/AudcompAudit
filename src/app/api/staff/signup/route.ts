import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const REQUIRED_CODE = process.env.INTERNAL_INVITE_CODE; // set in Vercel env

interface Body {
    invite_code: string;
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role?: 'admin' | 'expert' | 'staff' | 'sales';
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as Body;

        if (!REQUIRED_CODE) {
            return NextResponse.json({ error: 'Staff signup not configured (missing INTERNAL_INVITE_CODE).' }, { status: 500 });
        }
        if (!body.invite_code || body.invite_code.trim() !== REQUIRED_CODE) {
            return NextResponse.json({ error: 'Invalid invite code' }, { status: 401 });
        }
        if (!body.email || !isEmail(body.email.trim())) {
            return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
        }
        if (!body.password || body.password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
        }
        if (!body.full_name?.trim()) {
            return NextResponse.json({ error: 'Full name required' }, { status: 400 });
        }

        const role = body.role ?? 'staff';
        const email = body.email.trim().toLowerCase();

        // Create the auth user via service role + email_confirm so the user can
        // sign in immediately without the email verification round-trip.
        const { data: created, error: createErr } = await adminSupabase.auth.admin.createUser({
            email,
            password: body.password,
            email_confirm: true,
            user_metadata: { full_name: body.full_name.trim(), role, phone: body.phone ?? null, is_staff: true },
        });
        if (createErr || !created.user) {
            return NextResponse.json({ error: createErr?.message ?? 'Could not create user' }, { status: 500 });
        }

        // Upsert the profile row marked as staff so the app skips the audit
        // questionnaire and lands them on the right dashboard.
        const profilePayload: any = {
            id: created.user.id,
            email,
            full_name: body.full_name.trim(),
            phone: body.phone ?? null,
            is_staff: true,
            staff_role: role,
            has_completed_audit: true, // staff bypass the audit
            is_admin: role === 'admin',
            updated_at: new Date().toISOString(),
        };

        const { error: profileErr } = await (adminSupabase.from('profiles') as any).upsert(profilePayload);
        if (profileErr) {
            // Rollback the auth user so retry works
            await adminSupabase.auth.admin.deleteUser(created.user.id).catch(() => {});
            return NextResponse.json({ error: profileErr.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, user_id: created.user.id, role });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
