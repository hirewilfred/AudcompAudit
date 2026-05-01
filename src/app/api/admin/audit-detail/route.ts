import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { data: me } = await supabase
            .from('profiles').select('is_admin').eq('id', session.user.id).single() as any;
        if (!me?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const userId = new URL(request.url).searchParams.get('userId');
        if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

        const [profileRes, scoreRes, reportRes] = await Promise.all([
            adminSupabase
                .from('profiles')
                .select('id, full_name, email, organization, phone, has_completed_audit, assigned_expert_id, created_at, updated_at, directors_notes')
                .eq('id', userId)
                .maybeSingle(),
            adminSupabase
                .from('audit_scores')
                .select('overall_score, category_scores, recommendations, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle(),
            adminSupabase
                .from('ai_advisor_reports')
                .select('responses, recommendations, roadmap, narrative, roi_parameters, organization, updated_at')
                .eq('user_id', userId)
                .maybeSingle(),
        ]);

        let profile: any = profileRes.data || null;

        // Fallback: if no profiles row, try auth.users via service role so the
        // admin still sees the email/name they signed up with.
        if (!profile) {
            try {
                const { data: au } = await adminSupabase.auth.admin.getUserById(userId);
                if (au?.user) {
                    profile = {
                        id: au.user.id,
                        email: au.user.email ?? null,
                        full_name: (au.user.user_metadata as any)?.full_name ?? null,
                        organization: (au.user.user_metadata as any)?.organization ?? null,
                        phone: au.user.phone ?? null,
                        has_completed_audit: false,
                        assigned_expert_id: null,
                        created_at: au.user.created_at,
                        updated_at: au.user.updated_at ?? au.user.created_at,
                        directors_notes: null,
                    };
                }
            } catch (e) {
                console.error('auth.admin.getUserById failed', e);
            }
        }

        // Last-ditch placeholder so the page can still render audit/advisor data
        // even when neither profiles nor auth has a row.
        if (!profile && (scoreRes.data || reportRes.data)) {
            profile = {
                id: userId,
                email: null,
                full_name: null,
                organization: reportRes.data?.organization ?? null,
                phone: null,
                has_completed_audit: !!scoreRes.data,
                assigned_expert_id: null,
                created_at: scoreRes.data?.created_at ?? reportRes.data?.updated_at ?? new Date().toISOString(),
                updated_at: reportRes.data?.updated_at ?? new Date().toISOString(),
                directors_notes: null,
                _placeholder: true,
            };
        }

        let expert = null;
        if (profile?.assigned_expert_id) {
            const { data: e } = await adminSupabase
                .from('experts')
                .select('id, full_name, email, photo_url, bookings_url')
                .eq('id', profile.assigned_expert_id)
                .maybeSingle();
            expert = e || null;
        }

        return NextResponse.json({
            profile,
            expert,
            score: scoreRes.data || null,
            report: reportRes.data || null,
        });
    } catch (err: any) {
        console.error('audit-detail error', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
