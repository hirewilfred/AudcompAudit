import { PublicClientApplication, Configuration, AccountInfo } from '@azure/msal-browser';

const AZURE_CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '';

// Graph API scopes for reading M365 license data
const GRAPH_SCOPES = [
    'https://graph.microsoft.com/Directory.Read.All',
    'https://graph.microsoft.com/User.Read.All',
    'https://graph.microsoft.com/Organization.Read.All',
];

function buildMsalConfig(tenantId: string = 'common'): Configuration {
    return {
        auth: {
            clientId: AZURE_CLIENT_ID,
            // Use customer tenant ID for GDAP cross-tenant access,
            // or 'common' for the initial AUDCOMP admin sign-in
            authority: `https://login.microsoftonline.com/${tenantId}`,
            redirectUri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        },
        cache: {
            cacheLocation: 'sessionStorage',
        },
    };
}

let msalInstance: PublicClientApplication | null = null;

async function getMsalInstance(tenantId = 'common'): Promise<PublicClientApplication> {
    // Create a new instance if tenant changes
    if (!msalInstance) {
        msalInstance = new PublicClientApplication(buildMsalConfig(tenantId));
        await msalInstance.initialize();
    }
    return msalInstance;
}

// ─────────────────────────────────────────────
// Sign in AUDCOMP admin (used once per session)
// ─────────────────────────────────────────────
export async function signInAudcompAdmin(): Promise<{ accessToken: string; account: AccountInfo }> {
    const msal = await getMsalInstance('common');
    const result = await msal.loginPopup({
        scopes: GRAPH_SCOPES,
        prompt: 'select_account',
    });
    return { accessToken: result.accessToken, account: result.account };
}

// ─────────────────────────────────────────────
// GDAP: Get token scoped to a specific customer
// tenant using AUDCOMP admin's existing session
// ─────────────────────────────────────────────
export async function getGdapTokenForTenant(
    customerTenantId: string,
    adminAccount?: AccountInfo | null
): Promise<string> {
    // Use a fresh MSAL instance scoped to the customer's tenant
    const customerMsal = new PublicClientApplication(buildMsalConfig(customerTenantId));
    await customerMsal.initialize();

    try {
        // Try silent first if we have an account
        if (adminAccount) {
            const silent = await customerMsal.acquireTokenSilent({
                scopes: GRAPH_SCOPES,
                authority: `https://login.microsoftonline.com/${customerTenantId}`,
                account: adminAccount,
            });
            return silent.accessToken;
        }
    } catch {
        // Fall through to interactive
    }

    // Interactive: AUDCOMP admin signs in scoped to this customer tenant
    // GDAP allows cross-tenant access — admin uses their own credentials
    const result = await customerMsal.loginPopup({
        scopes: GRAPH_SCOPES,
        authority: `https://login.microsoftonline.com/${customerTenantId}`,
        prompt: 'select_account',
    });
    return result.accessToken;
}

// ─────────────────────────────────────────────
// Sign out
// ─────────────────────────────────────────────
export async function signOutMsal(): Promise<void> {
    const msal = await getMsalInstance();
    const accounts = msal.getAllAccounts();
    if (accounts.length > 0) {
        await msal.logoutPopup({ account: accounts[0] });
    }
    msalInstance = null;
}

export async function getCurrentAccount(): Promise<AccountInfo | null> {
    const msal = await getMsalInstance();
    const accounts = msal.getAllAccounts();
    return accounts[0] || null;
}
