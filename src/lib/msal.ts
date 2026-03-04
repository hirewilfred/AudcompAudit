import { PublicClientApplication, Configuration, PopupRequest } from '@azure/msal-browser';

// AUDCOMP's multi-tenant Azure App Registration Client ID
const AZURE_CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '';

const msalConfig: Configuration = {
    auth: {
        clientId: AZURE_CLIENT_ID,
        // 'common' allows any Microsoft org tenant (multi-tenant)
        authority: 'https://login.microsoftonline.com/common',
        redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    },
    cache: {
        cacheLocation: 'sessionStorage',
    },
};

// Scopes needed to read licensed users from Microsoft Graph
export const M365_SCOPES: PopupRequest = {
    scopes: [
        'https://graph.microsoft.com/Directory.Read.All',
        'https://graph.microsoft.com/User.Read.All',
        'https://graph.microsoft.com/Organization.Read.All',
    ],
    prompt: 'select_account', // Force account selection so admin can choose the right tenant
};

let msalInstance: PublicClientApplication | null = null;

export async function getMsalInstance(): Promise<PublicClientApplication> {
    if (!msalInstance) {
        msalInstance = new PublicClientApplication(msalConfig);
        await msalInstance.initialize();
    }
    return msalInstance;
}

export async function signInWithM365(): Promise<{ accessToken: string; account: any }> {
    const msal = await getMsalInstance();
    const result = await msal.loginPopup(M365_SCOPES);
    return {
        accessToken: result.accessToken,
        account: result.account,
    };
}

export async function acquireM365Token(): Promise<string | null> {
    const msal = await getMsalInstance();
    const accounts = msal.getAllAccounts();
    if (accounts.length === 0) return null;

    try {
        const result = await msal.acquireTokenSilent({
            ...M365_SCOPES,
            account: accounts[0],
        });
        return result.accessToken;
    } catch {
        // Silent failed — need interactive
        const result = await msal.acquireTokenPopup({
            ...M365_SCOPES,
            account: accounts[0],
        });
        return result.accessToken;
    }
}

export async function signOutM365(): Promise<void> {
    const msal = await getMsalInstance();
    const accounts = msal.getAllAccounts();
    if (accounts.length > 0) {
        await msal.logoutPopup({ account: accounts[0] });
    }
}
