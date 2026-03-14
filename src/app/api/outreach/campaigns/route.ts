import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        const { name, ams_client_id, status } = await req.json();

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Campaign name is required.' }, { status: 400 });
        }

        const supabase = await createClient();

        const { data, error } = await (supabase.from('outreach_campaigns') as any)
            .insert({
                name: name.trim(),
                ams_client_id: ams_client_id || null,
                status: status || 'draft',
            })
            .select('id')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ id: data.id }, { status: 201 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
