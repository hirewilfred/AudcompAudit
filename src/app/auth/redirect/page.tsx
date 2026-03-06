'use client';

import { useEffect } from 'react';
import { PublicClientApplication } from '@azure/msal-browser';

/**
 * Blank MSAL redirect handler page.
 * Azure AD sends the auth code here after login popup.
 * MSAL detects the auth code in the URL, processes it,
 * and automatically closes this popup window.
 */
export default function AuthRedirectPage() {
    useEffect(() => {
        const clientId = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '';
        if (!clientId) return;

        const msal = new PublicClientApplication({
            auth: {
                clientId,
                authority: 'https://login.microsoftonline.com/common',
                redirectUri: `${window.location.origin}/auth/redirect`,
            },
            cache: { cacheLocation: 'sessionStorage' },
        });

        msal.initialize().then(() => {
            // This handles the auth code in the URL and sends the result
            // back to the parent window, then closes this popup automatically.
            msal.handleRedirectPromise().catch(() => {
                // Silently ignore errors (e.g. if no auth code in URL)
            });
        });
    }, []);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'sans-serif',
            color: '#94a3b8',
            fontSize: '14px',
        }}>
            Signing in...
        </div>
    );
}
