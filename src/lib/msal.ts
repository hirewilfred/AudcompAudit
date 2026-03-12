import { PublicClientApplication, Configuration, AccountInfo } from '@azure/msal-browser';

const AZURE_CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID || '';
const REDIRECT_URI = 'https://aiaudit.audcomp.ai/auth/redirect';

const GRAPH_SCOPES = [
    'https://graph.microsoft.com/Directory.Read.All',
    'https://graph.microsoft.com/User.Read.All',
    'https://graph.microsoft.com/Organization.Read.All',
];

function buildMsalConfig(tenantId: string = 'common'): Configuration {
    return {
        auth: {
            clientId: AZURE_CLIENT_ID,
            authority: `https://login.microsoftonline.com/${tenantId}`,
            redirectUri: REDIRECT_URI,
        },
        cache: {
            cacheLocation: 'sessionStorage',
        },
    };
}

let msalInstance: PublicClientApplication | null = null;
let msalInitPromise: Promise<PublicClientApplication> | null = null;

async function getMsalInstance(tenantId = 'common'): Promise<PublicClientApplication> {
    if (!msalInitPromise) {
        const instance = new PublicClientApplication(buildMsalConfig(tenantId));
        msalInitPromise = instance.initialize().then(() => {
            msalInstance = instance;
            return instance;
        });
    }
    return msalInitPromise;
}

// ─────────────────────────────────────────────────────────────
// Call this on component mount so loginPopup() can be called
// synchronously from the click handler (avoids popup blocking).
// ─────────────────────────────────────────────────────────────
export async function preInitMsal(): Promise<AccountInfo | null> {
    const msal = await getMsalInstance('common');
    const accounts = msal.getAllAccounts();
    return accounts[0] || null;
}

// ─────────────────────────────────────────────────────────────
// Call this SYNCHRONOUSLY from a click handler (no await before
// loginPopup). Returns a Promise so caller can .then()/.catch().
// ─────────────────────────────────────────────────────────────
export function signInPopupSync(): Promise<AccountInfo> {
    if (!msalInstance) {
        return Promise.reject(new Error('Please wait — Microsoft sign-in is still initializing.'));
    }
    return msalInstance
        .loginPopup({ scopes: GRAPH_SCOPES, prompt: 'select_account' })
        .then(result => result.account);
}

// ─────────────────────────────────────────────────────────────
// GDAP: Get token scoped to a specific customer tenant.
// Creates a fresh MSAL instance for the customer's authority.
// ─────────────────────────────────────────────────────────────
export async function getGdapTokenForTenant(
    customerTenantId: string,
    adminAccount?: AccountInfo | null
): Promise<string> {
    const customerMsal = new PublicClientApplication(buildMsalConfig(customerTenantId));
    await customerMsal.initialize();

    try {
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

    const result = await customerMsal.loginPopup({
        scopes: GRAPH_SCOPES,
        authority: `https://login.microsoftonline.com/${customerTenantId}`,
        prompt: 'select_account',
    });
    return result.accessToken;
}

// ─────────────────────────────────────────────────────────────
// Advisor-specific login: only requests User.Read so no admin
// consent is required. Returns the access token for Graph API.
// Call SYNCHRONOUSLY from a click handler.
// ─────────────────────────────────────────────────────────────
export function loginForAdvisorSync(): Promise<{ account: AccountInfo; accessToken: string }> {
    if (!msalInstance) {
        return Promise.reject(new Error('Please wait — Microsoft sign-in is still initializing.'));
    }
    return msalInstance
        .loginPopup({ scopes: ['User.Read'] })
        .then(result => ({ account: result.account, accessToken: result.accessToken }));
}

export async function signOutMsal(): Promise<void> {
    const msal = await getMsalInstance();
    const accounts = msal.getAllAccounts();
    if (accounts.length > 0) {
        await msal.logoutPopup({ account: accounts[0] });
    }
    msalInstance = null;
    msalInitPromise = null;
}
