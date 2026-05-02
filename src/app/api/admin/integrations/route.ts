import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    saveIntegration, listIntegrations, deleteIntegration, setActive,
    IntegrationProvider,
} from '@/lib/outreach/integrations';

async function requireAdmin() {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { ok: false as const, status: 401, error: 'Unauthorized' };
    const { data: profile } = await supabase
        .from('profiles').select('is_admin').eq('id', session.user.id).single() as any;
    if (!profile?.is_admin) return { ok: false as const, status: 403, error: 'Forbidden' };
    return { ok: true as const, userId: session.user.id };
}

export async function GET() {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    try {
        const rows = await listIntegrations();
        return NextResponse.json({ integrations: rows });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    try {
        const body = await req.json();
        const { provider, label, rawKey, scope, expertId } = body as {
            provider: IntegrationProvider;
            label: string;
            rawKey: string;
            scope?: 'global' | 'per_expert';
            expertId?: string | null;
        };

        if (!provider || !label?.trim() || !rawKey?.trim()) {
            return NextResponse.json({ error: 'provider, label, and rawKey are required' }, { status: 400 });
        }

        const row = await saveIntegration({
            provider,
            label: label.trim(),
            rawKey: rawKey.trim(),
            scope,
            expertId,
            createdBy: auth.userId,
        });
        return NextResponse.json({ integration: row });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    try {
        const { id, is_active } = await req.json();
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        await setActive(id, !!is_active);
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const auth = await requireAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    try {
        const id = new URL(req.url).searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
        await deleteIntegration(id);
        return NextResponse.json({ ok: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
