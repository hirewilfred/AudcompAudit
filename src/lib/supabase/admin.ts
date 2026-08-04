import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client for server-side writes that must bypass RLS.
//
// The cw_* tables have RLS enabled with read-only policies for staff/admin and
// no INSERT policies at all, so sync writes cannot go through the anon/session
// client. Cron invocations have no user session whatsoever — auth.uid() is null
// and is_staff_or_admin() returns false — so they would fail every policy check.
// Sync routes are already gated by authorizeSync() before reaching this client.
//
// Never import this from a Client Component; the key must stay server-side.
export function createAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
        throw new Error(
            'Supabase service role is not configured (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)',
        );
    }
    return createSupabaseClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    });
}
