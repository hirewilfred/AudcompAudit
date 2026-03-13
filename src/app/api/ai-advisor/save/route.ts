import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

        // We'll store this in profiles for simplicity, or audit_scores if we want historical records
        // Given the requirement to see it in admin view, saving to profiles.directors_notes (or a dedicated table if we had one)
        // Since we cannot run migrations, we'll use a JSON string in directors_notes prefixed with AI_ADVISOR_REPORT:
        
        const reportData = {
            responses,
            narrative,
            recommendations,
            roadmap,
            savedAt: new Date().toISOString()
        };

        // 1. Try to save to the new dedicated table
        const { error: tableError } = await (supabase
            .from('ai_advisor_reports') as any)
            .upsert({
                user_id: session.user.id,
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
            }, { onConflict: 'user_id' }); // Upsert by user_id if we want only one report per user

        // 2. Also keep directors_notes updated for backward compatibility and admin views that use it
        const { error: profileError } = await (supabase
            .from('profiles') as any)
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
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        // 1. Try the new dedicated table first
        const { data: tableData, error: tableError } = await (supabase
            .from('ai_advisor_reports') as any)
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (!tableError && tableData) {
            return NextResponse.json(tableData);
        }

        // 2. Fallback to profiles for legacy reports
        const { data, error } = await (supabase
            .from('profiles') as any)
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
