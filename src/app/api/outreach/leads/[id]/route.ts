import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await req.json();

        const supabase = await createClient();

        const allowed = [
            'status', 'notes', 'assigned_rep', 'next_action_note', 'next_action_at',
            'meeting_url', 'meeting_booked_at', 'follow_up_count',
            'contacted_at', 'replied_at', 'interested_at', 'booked_at', 'closed_at', 'last_touch_at',
        ];
        const update: Record<string, unknown> = {};
        for (const key of allowed) {
            if (key in body) update[key] = body[key];
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
        }

        const { error } = await (supabase.from('outreach_leads') as any)
            .update(update)
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
