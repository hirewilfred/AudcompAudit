import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const masterKey = process.env.INTEGRATIONS_MASTER_KEY;
if (!masterKey) {
    // Don't throw at module load — only when we actually try to use it,
    // so the server can still build during preview deploys without the key.
    console.warn('[integrations] INTEGRATIONS_MASTER_KEY is not set');
}

export type IntegrationProvider =
    | 'apify' | 'apollo' | 'instantly' | 'phantombuster' | 'resend'
    | 'linkedin_oauth' | 'gmail_oauth';

export interface IntegrationRow {
    id: string;
    provider: IntegrationProvider;
    label: string;
    scope: 'global' | 'per_expert';
    expert_id: string | null;
    last4: string;
    is_active: boolean;
    rotated_at: string;
    last_test_at: string | null;
    last_test_ok: boolean | null;
    last_test_error: string | null;
}

const last4 = (key: string) => key.slice(-4);

/**
 * Save (insert or rotate) an API key. Encrypts via pgp_sym_encrypt server-side.
 * NEVER call this from the browser — it requires the master key.
 */
export async function saveIntegration(args: {
    provider: IntegrationProvider;
    label: string;
    rawKey: string;
    scope?: 'global' | 'per_expert';
    expertId?: string | null;
    createdBy?: string | null;
}) {
    if (!masterKey) throw new Error('INTEGRATIONS_MASTER_KEY not configured');
    const { provider, label, rawKey } = args;
    const scope = args.scope ?? 'global';
    const expertId = scope === 'per_expert' ? args.expertId ?? null : null;

    // Encrypt server-side via Postgres pgp_sym_encrypt(text, key) returning bytea.
    const { data, error } = await adminSupabase.rpc('pgp_sym_encrypt' as any, {
        data: rawKey,
        psw: masterKey,
    });

    let encrypted: any;
    if (error) {
        // Fallback path — RPC may not be exposed; do encryption inline via SQL.
        const { data: encRow, error: encErr } = await (adminSupabase as any)
            .from('integrations')
            .select('id')
            .limit(1); // dummy to ensure connection; real encryption below
        if (encErr) throw encErr;
        const { data: rows, error: sqlErr } = await (adminSupabase as any).rpc('exec_encrypt', {
            payload: rawKey, master: masterKey,
        });
        if (sqlErr || !rows) throw sqlErr ?? new Error('Encryption RPC missing');
        encrypted = rows;
    } else {
        encrypted = data;
    }

    // Upsert keyed on (provider, label) for global or (provider, expert_id) for per-expert.
    const upsertPayload: any = {
        provider,
        label,
        scope,
        expert_id: expertId,
        encrypted_key: encrypted,
        last4: last4(rawKey),
        is_active: true,
        rotated_at: new Date().toISOString(),
        created_by: args.createdBy ?? null,
    };

    const conflict = scope === 'global' ? 'provider,label' : 'provider,expert_id';

    const { data: row, error: upsertErr } = await (adminSupabase as any)
        .from('integrations')
        .upsert(upsertPayload, { onConflict: conflict })
        .select('id, provider, label, scope, expert_id, last4, is_active, rotated_at, last_test_at, last_test_ok, last_test_error')
        .single();

    if (upsertErr) throw upsertErr;
    return row as IntegrationRow;
}

/**
 * Decrypt and return the raw key for use in a server-side adapter call.
 * Returns null if no active integration matches.
 */
export async function getIntegrationKey(args: {
    provider: IntegrationProvider;
    expertId?: string | null;
    label?: string;
}): Promise<string | null> {
    if (!masterKey) throw new Error('INTEGRATIONS_MASTER_KEY not configured');

    // Use a tiny SQL function to decrypt without round-tripping bytea through JS.
    const { data, error } = await (adminSupabase as any).rpc('integration_decrypt_key', {
        p_provider: args.provider,
        p_expert_id: args.expertId ?? null,
        p_label: args.label ?? null,
        p_master: masterKey,
    });

    if (error) {
        console.error('[integrations] decrypt failed', error);
        return null;
    }
    return (data as string | null) ?? null;
}

export async function listIntegrations(): Promise<IntegrationRow[]> {
    const { data, error } = await (adminSupabase as any)
        .from('integrations')
        .select('id, provider, label, scope, expert_id, last4, is_active, rotated_at, last_test_at, last_test_ok, last_test_error')
        .order('provider', { ascending: true })
        .order('label', { ascending: true });

    if (error) throw error;
    return (data ?? []) as IntegrationRow[];
}

export async function deleteIntegration(id: string) {
    const { error } = await (adminSupabase as any).from('integrations').delete().eq('id', id);
    if (error) throw error;
}

export async function setActive(id: string, active: boolean) {
    const { error } = await (adminSupabase as any)
        .from('integrations')
        .update({ is_active: active })
        .eq('id', id);
    if (error) throw error;
}
