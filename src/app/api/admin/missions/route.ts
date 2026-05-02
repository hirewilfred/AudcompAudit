import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false as const, status: 401 };
    const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', session.user.id).single() as any;
    if (!profile?.is_admin) return { ok: false as const, status: 403 };
    return { ok: true as const };
}

// GET /api/admin/missions             → list of recent missions (grouped by mission_id)
// GET /api/admin/missions?missionId=… → single mission detail with all child runs
export async function GET(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: auth.status });

    const url = new URL(req.url);
    const missionId = url.searchParams.get('missionId');

    if (missionId) {
        const { data: runs, error } = await (adminSupabase as any)
            .from('marketing_agent_runs')
            .select('*')
            .eq('mission_id', missionId)
            .order('started_at', { ascending: true });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ runs });
    }

    // List view: get every mission's orchestrator row + a child-run count
    const { data: rows, error } = await (adminSupabase as any)
        .from('marketing_agent_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(300);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Group by mission_id
    const byMission = new Map<string, any[]>();
    for (const r of (rows ?? [])) {
        if (!byMission.has(r.mission_id)) byMission.set(r.mission_id, []);
        byMission.get(r.mission_id)!.push(r);
    }

    const missions = Array.from(byMission.entries()).map(([id, runs]) => {
        const orchestrator = runs.find(r => r.agent_name === 'marketing-orchestrator') ?? runs[0];
        const status =
            runs.some(r => r.status === 'failed') ? 'failed'
            : runs.every(r => r.status === 'succeeded') ? 'succeeded'
            : runs.some(r => r.status === 'running') ? 'running'
            : 'queued';
        return {
            mission_id: id,
            goal: orchestrator?.goal ?? null,
            status,
            started_at: orchestrator?.started_at ?? runs[0].started_at,
            completed_at: status === 'succeeded' || status === 'failed'
                ? runs[runs.length - 1].completed_at
                : null,
            agent_count: runs.length,
            agents: Array.from(new Set(runs.map(r => r.agent_name))),
            output: orchestrator?.output ?? null,
        };
    });

    missions.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());

    // Counts for KPI tiles
    const totals = {
        total: missions.length,
        running: missions.filter(m => m.status === 'running').length,
        succeeded_24h: missions.filter(m =>
            m.status === 'succeeded'
            && m.completed_at
            && Date.now() - new Date(m.completed_at).getTime() < 24 * 60 * 60 * 1000
        ).length,
        failed_24h: missions.filter(m =>
            m.status === 'failed'
            && m.completed_at
            && Date.now() - new Date(m.completed_at).getTime() < 24 * 60 * 60 * 1000
        ).length,
    };

    return NextResponse.json({ missions: missions.slice(0, 50), totals });
}
