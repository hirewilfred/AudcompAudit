import { NextRequest, NextResponse } from 'next/server';

const AZURE_CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;

const SCOPES = [
    'offline_access',
    'https://graph.microsoft.com/Directory.Read.All',
    'https://graph.microsoft.com/Organization.Read.All',
].join(' ');

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ clientId: string }> }
) {
    const { clientId } = await params;

    const baseUrl = req.nextUrl.origin;
    const redirectUri = `${baseUrl}/api/ams/m365-callback`;

    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.set('client_id', AZURE_CLIENT_ID);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', SCOPES);
    authUrl.searchParams.set('response_mode', 'query');
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('state', clientId);

    return NextResponse.redirect(authUrl.toString());
}
