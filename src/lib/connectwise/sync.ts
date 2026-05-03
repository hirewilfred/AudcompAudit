import { createClient } from '@/lib/supabase/server';

export async function logSyncRun<T>(
    scope: string,
    fn: () => Promise<{ count: number; meta?: Record<string, unknown> } & T>,
) {
    const supabase = await createClient();
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
