import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const AZURE_CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // clientId
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    const appUrl = req.nextUrl.origin;

    if (error || !code || !state) {
        const msg = errorDescription || error || 'OAuth flow failed or was cancelled.';
        return NextResponse.redirect(`${appUrl}/admin/ams/clients/${state}?m365_error=${encodeURIComponent(msg)}`);
    }

    const clientId = state;
    const redirectUri = `${appUrl}/api/ams/m365-callback`;

    // Guard: ensure env vars are present (would silently be "undefined" string otherwise)
    if (!AZURE_CLIENT_ID || !AZURE_CLIENT_SECRET) {
        return NextResponse.redirect(
            `${appUrl}/admin/ams/clients/${clientId}?m365_error=${encodeURIComponent('Server configuration error: Azure credentials are not set. Contact your administrator.')}`
        );
    }

    // Exchange the authorization code for tokens
    const tokenRes = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: AZURE_CLIENT_ID,
            client_secret: AZURE_CLIENT_SECRET,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
            scope: 'https://graph.microsoft.com/Directory.Read.All https://graph.microsoft.com/Organization.Read.All offline_access',
        }),
    });

    if (!tokenRes.ok) {
        let msError = 'Token exchange failed.';
        try {
            const errJson = await tokenRes.json();
            msError = errJson.error_description || errJson.error || msError;
        } catch {
            msError = await tokenRes.text().catch(() => msError);
        }
        console.error('Token exchange failed:', msError);
        return NextResponse.redirect(`${appUrl}/admin/ams/clients/${clientId}?m365_error=${encodeURIComponent(msError)}`);
    }

    const tokens = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Extract Tenant ID from the access token JWT (tid claim)
    let m365TenantId: string | null = null;
    try {
        const parts = tokens.access_token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(
                Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
            );
            m365TenantId = payload.tid || null;
        }
    } catch { /* non-critical — tenant ID can be set manually if needed */ }

    // Save tokens to Supabase (using server client to include auth cookies for RLS)
    const supabase = await createClient();

    const { error: updateError } = await (supabase
        .from('ams_clients') as any)
        .update({
            m365_connected: true,
            m365_connected_at: new Date().toISOString(),
            m365_access_token: tokens.access_token,
            m365_refresh_token: tokens.refresh_token,
            m365_token_expires_at: expiresAt,
            ...(m365TenantId && { m365_tenant_id: m365TenantId }),
        })
        .eq('id', clientId);

    if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.redirect(`${appUrl}/admin/ams/clients/${clientId}?m365_error=${encodeURIComponent('Could not save connection. Please try again.')}`);
    }

    return NextResponse.redirect(`${appUrl}/admin/ams/clients/${clientId}?m365_connected=1`);
}
