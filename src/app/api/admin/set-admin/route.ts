import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify caller is authenticated
        const supabase = await createServerClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Verify caller is an admin (checked via profiles table)
        const { data: caller } = await (supabase as any)
            .from('profiles')
            .select('is_admin')
            .eq('id', session.user.id)
            .single();

        if (!caller?.is_admin) {
            return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
        }

        // 3. Process the update request
        const { userId, isAdmin } = await req.json();
        if (!userId || typeof isAdmin !== 'boolean') {
            return NextResponse.json({ error: 'userId and isAdmin are required.' }, { status: 400 });
        }

        // 4. Update the profile using the user's session
        // This leverages the "Admins can update any profile" RLS policy.
        // We use 'as any' here to avoid TypeScript inference issues with the profiles table in some environments.
        const { error } = await (supabase as any)
            .from('profiles')
            .update({ is_admin: isAdmin })
            .eq('id', userId);

        if (error) {
            console.error('Database update error:', error);
            throw new Error(`Permission denied: Ensure the Admin RLS policy is applied. Error: ${error.message}`);
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('set-admin error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
