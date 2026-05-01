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
                .select('id, full_name, email, organization, phone, has_completed_audit, assigned_expert_id, created_at, updated_at')
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
                .select('responses, recommendations, roadmap, narrative, roi_parameters, updated_at')
                .eq('user_id', userId)
                .maybeSingle(),
        ]);

        const profile = profileRes.data || null;
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
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
