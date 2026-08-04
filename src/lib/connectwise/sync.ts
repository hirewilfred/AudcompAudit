import { createAdminClient } from '@/lib/supabase/admin';

export async function logSyncRun<T>(
    scope: string,
    fn: () => Promise<{ count: number; meta?: Record<string, unknown> } & T>,
) {
    // cw_sync_runs has RLS on with no INSERT policy — this must use the service role.
    const supabase = createAdminClient();
    const { data: run } = await supabase
        .from('cw_sync_runs')
        .insert({ scope })
        .select('id')
        .single();
    const runId = run?.id as string | undefined;

    try {
        const result = await fn();
        if (runId) {
            await supabase
                .from('cw_sync_runs')
                .update({
                    finished_at: new Date().toISOString(),
                    record_count: result.count,
                    success: true,
                    meta: result.meta ?? null,
                })
                .eq('id', runId);
        }
        return { ok: true as const, count: result.count, meta: result.meta };
    } catch (err) {
        if (runId) {
            await supabase
                .from('cw_sync_runs')
                .update({
                    finished_at: new Date().toISOString(),
                    success: false,
                    error_message: (err as Error).message,
                })
                .eq('id', runId);
        }
        throw err;
    }
}
