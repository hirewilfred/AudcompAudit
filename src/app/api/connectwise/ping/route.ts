import { NextResponse } from 'next/server';
import { cwFetch, isConnectWiseConfigured, ConnectWiseError } from '@/lib/connectwise/client';

export const runtime = 'nodejs';

export async function GET() {
    if (!isConnectWiseConfigured()) {
        return NextResponse.json(
            { ok: false, error: 'ConnectWise env vars not set (CW_SITE, CW_COMPANY_ID, CW_PUBLIC_KEY, CW_PRIVATE_KEY, CW_CLIENT_ID)' },
            { status: 500 },
        );
    }
    try {
        // /system/info is the lightest authenticated probe.
        const info = await cwFetch<Record<string, unknown>>('/system/info');
        return NextResponse.json({ ok: true, info });
    } catch (err) {
        const cw = err instanceof ConnectWiseError ? err : null;
        return NextResponse.json(
            { ok: false, status: cw?.status, error: (err as Error).message, body: cw?.body },
            { status: 502 },
        );
    }
}
