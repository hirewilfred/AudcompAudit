import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service role client bypasses RLS — server-side only
const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { responses, narrative, recommendations, roadmap } = body;

        if (!responses) {
            return NextResponse.json({ error: 'Missing responses' }, { status: 400 });
        }

        // Get user's organization for lookup purposes
        const { data: profile } = await supabase
            .from('profiles')
            .select('organization')
            .eq('id', session.user.id)
            .single();

        const reportData = {
            responses,
            narrative,
            recommendations,
            roadmap,
            savedAt: new Date().toISOString()
        };

        // 1. Save to the dedicated table
        const { error: tableError } = await supabase
            .from('ai_advisor_reports')
            .upsert({
                user_id: session.user.id,
                organization: profile?.organization ?? null,
                responses,
                narrative,
                recommendations,
                roadmap,
                roi_parameters: {
                    annualCostPerUser: body.annualCostPerUser,
                    numUsers: body.numUsers,
                    hourlyRate: body.hourlyRate,
                    timeSaved: body.timeSaved
                }
            }, { onConflict: 'user_id' });

        // 2. Also keep directors_notes for backward compatibility
        const { error: profileError } = await supabase
            .from('profiles')
            .update({
                directors_notes: `AI_ADVISOR_REPORT:${JSON.stringify(reportData)}`
            })
            .eq('id', session.user.id);

        if (tableError && profileError) throw tableError || profileError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving advisor results:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // Use service role client to bypass RLS for admin reads
        const { data: tableData, error: tableError } = await adminSupabase
            .from('ai_advisor_reports')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (!tableError && tableData) {
            return NextResponse.json(tableData);
        }

        // Fallback to profiles.directors_notes for legacy reports
        const { data, error } = await adminSupabase
            .from('profiles')
            .select('directors_notes')
            .eq('id', userId)
            .single();

        if (error) throw error;

        if (data?.directors_notes?.startsWith('AI_ADVISOR_REPORT:')) {
            const jsonStr = data.directors_notes.replace('AI_ADVISOR_REPORT:', '');
            return NextResponse.json(JSON.parse(jsonStr));
        }

        return NextResponse.json({ error: 'No report found' }, { status: 404 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
