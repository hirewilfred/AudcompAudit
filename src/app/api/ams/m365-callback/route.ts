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
        }),
    });

    if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('Token exchange failed:', errText);
        return NextResponse.redirect(`${appUrl}/admin/ams/clients/${clientId}?m365_error=${encodeURIComponent('Token exchange failed. Please try again.')}`);
    }

    const tokens = await tokenRes.json();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

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
        })
        .eq('id', clientId);

    if (updateError) {
        console.error('Supabase update error:', updateError);
        return NextResponse.redirect(`${appUrl}/admin/ams/clients/${clientId}?m365_error=${encodeURIComponent('Could not save connection. Please try again.')}`);
    }

    return NextResponse.redirect(`${appUrl}/admin/ams/clients/${clientId}?m365_connected=1`);
}
