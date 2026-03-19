import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const AZURE_CLIENT_ID = process.env.NEXT_PUBLIC_AZURE_CLIENT_ID!;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET!;

// All AMS-relevant M365 license SKUs
const AMS_LICENSE_SKUS: Record<string, string> = {
    '66b55226-6b4f-492c-910c-a3b7a3c9d993': 'Microsoft 365 F3',
    'b05e124f-c7cc-45a0-a6aa-8cf78c946968': 'Microsoft 365 Business Basic',
    'cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46': 'Microsoft 365 Business Premium',
    'f245ecc8-75af-4f8e-b61f-27d8114de5f3': 'Microsoft 365 Business Standard',
    '05e9a617-0261-4cee-bb44-138d3ef5d965': 'Microsoft 365 E3',
    '06ebc4ee-1bb5-47dd-8120-11324bc54e06': 'Microsoft 365 E5',
    '18181a46-0d4e-45cd-891e-60aabd171b4e': 'Office 365 E1',
    '6fd2c87f-b296-42f0-b197-1e91e994b900': 'Office 365 E3',
    'c7df2760-2c81-4ef7-b578-5b5392b571df': 'Office 365 E5',
    'a6d18b68-a67e-4cbd-ba00-8744bc468faa': 'Microsoft 365 Copilot',
};

// Entry-level plans — NOT counted for AMS billing.
const ENTRY_LICENSE_SKUS = new Set([
    '66b55226-6b4f-492c-910c-a3b7a3c9d993', // Microsoft 365 F3
    'b05e124f-c7cc-45a0-a6aa-8cf78c946968', // Microsoft 365 Business Basic
    '18181a46-0d4e-45cd-891e-60aabd171b4e', // Office 365 E1
]);

// AMS-billable: Business Standard and above (Standard, Premium, E3, E5, Copilot).
// These are compared against contracted seats to calculate missing revenue.
const BILLABLE_LICENSE_SKUS = new Set([
    'f245ecc8-75af-4f8e-b61f-27d8114de5f3', // Microsoft 365 Business Standard
    'cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46', // Microsoft 365 Business Premium
    '05e9a617-0261-4cee-bb44-138d3ef5d965', // Microsoft 365 E3
    '06ebc4ee-1bb5-47dd-8120-11324bc54e06', // Microsoft 365 E5
    '6fd2c87f-b296-42f0-b197-1e91e994b900', // Office 365 E3
    'c7df2760-2c81-4ef7-b578-5b5392b571df', // Office 365 E5
    'a6d18b68-a67e-4cbd-ba00-8744bc468faa', // Microsoft 365 Copilot
]);

// Above-standard subset (Premium, E3, E5, Copilot) — stored as premium_licensed_users.
const ABOVE_STANDARD_SKUS = new Set([
    'cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46', // Microsoft 365 Business Premium
    '05e9a617-0261-4cee-bb44-138d3ef5d965', // Microsoft 365 E3
    '06ebc4ee-1bb5-47dd-8120-11324bc54e06', // Microsoft 365 E5
    '6fd2c87f-b296-42f0-b197-1e91e994b900', // Office 365 E3
    'c7df2760-2c81-4ef7-b578-5b5392b571df', // Office 365 E5
    'a6d18b68-a67e-4cbd-ba00-8744bc468faa', // Microsoft 365 Copilot
]);

async function refreshAccessToken(refreshToken: string, tenantId?: string | null): Promise<{ accessToken: string; newRefreshToken: string; expiresAt: string }> {
    // Use the client's specific tenant for token refresh — avoids token errors
    // caused by tenant-specific conditional access policies when using 'common'.
    const authority = tenantId
        ? `https://login.microsoftonline.com/${tenantId}`
        : 'https://login.microsoftonline.com/common';

    const res = await fetch(`${authority}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: AZURE_CLIENT_ID,
            client_secret: AZURE_CLIENT_SECRET,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            scope: 'https://graph.microsoft.com/Directory.Read.All https://graph.microsoft.com/Organization.Read.All offline_access',
        }),
    });

    if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Token refresh failed: ${errText}`);
    }

    const data = await res.json();
    return {
        accessToken: data.access_token,
        newRefreshToken: data.refresh_token || refreshToken,
        expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
    };
}

export async function POST(req: NextRequest) {
    try {
        const { clientId } = await req.json();

        if (!clientId) {
            return NextResponse.json({ error: 'clientId is required.' }, { status: 400 });
        }

        // Use server client to include auth cookies for RLS
        const supabase = await createClient();

        // Fetch client with stored tokens
        const { data: client, error: fetchError } = await (supabase
            .from('ams_clients') as any)
            .select('id, company_name, m365_connected, m365_refresh_token, m365_access_token, m365_token_expires_at, m365_tenant_id')
            .eq('id', clientId)
            .single();

        if (fetchError || !client) {
            return NextResponse.json({ error: 'Client not found.' }, { status: 404 });
        }

        if (!client.m365_connected || !client.m365_refresh_token) {
            return NextResponse.json({ error: 'This client has not connected their Microsoft 365 account yet. Go to the client detail page and click "Connect M365".' }, { status: 400 });
        }

        // Refresh the access token
        let accessToken = client.m365_access_token;
        try {
            const refreshed = await refreshAccessToken(client.m365_refresh_token, client.m365_tenant_id);
            accessToken = refreshed.accessToken;

            // Update stored tokens
            await (supabase.from('ams_clients') as any).update({
                m365_access_token: refreshed.accessToken,
                m365_refresh_token: refreshed.newRefreshToken,
                m365_token_expires_at: refreshed.expiresAt,
            }).eq('id', clientId);
        } catch (refreshErr: any) {
            console.error('Token refresh error:', refreshErr);
            // Mark as disconnected so user knows to reconnect
            await (supabase.from('ams_clients') as any).update({
                m365_connected: false,
            }).eq('id', clientId);
            return NextResponse.json({
                error: 'Microsoft 365 token expired. Please go to the client detail page and re-connect their account.',
            }, { status: 401 });
        }

        // Fetch all subscribed SKUs from Microsoft Graph
        const skuRes = await fetch('https://graph.microsoft.com/v1.0/subscribedSkus', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!skuRes.ok) {
            const errText = await skuRes.text();
            console.error('Graph API error:', errText);
            return NextResponse.json(
                { error: 'Microsoft Graph API error. The token may have been revoked — please reconnect this client.' },
                { status: 400 }
            );
        }

        const { value: skus } = await skuRes.json();

        // Count licensed users — active only (capabilityStatus Enabled/Warning), by tier
        let totalLicensedUsers = 0;
        let billableLicensedUsers = 0;   // Standard+ consumed → stored as basic_licensed_users
        let aboveStandardUsers = 0;      // Premium/E3/E5 consumed → stored as premium_licensed_users
        let totalProvisionedSeats = 0;   // Standard+ provisioned (what they pay Microsoft for)
        const licenseBreakdown: Record<string, number> = {};
        const licenseBreakdownProvisioned: Record<string, number> = {};

        // All non-AMS Microsoft licenses (Visio, Project, Intune, Defender, Azure AD P2, etc.)
        const otherLicenseBreakdown: Record<string, number> = {};
        const otherLicenseBreakdownProvisioned: Record<string, number> = {};
        // skuId → skuPartNumber for non-AMS SKUs, used when building user lists below
        const nonAmsSkuIdToPartNumber: Record<string, string> = {};
        // partNumber → skuId, stored so the UI can display the raw GUID
        const otherLicenseSkuIds: Record<string, string> = {};

        for (const sku of skus) {
            const skuName = AMS_LICENSE_SKUS[sku.skuId];
            if (skuName) {
                // For AMS billing accuracy, only count active subscriptions
                if (sku.capabilityStatus !== 'Enabled' && sku.capabilityStatus !== 'Warning') continue;

                const consumed = sku.consumedUnits || 0;
                const provisioned = sku.prepaidUnits?.enabled || 0;

                // Include in breakdown if provisioned OR consumed — shows all purchased licenses
                if (consumed > 0 || provisioned > 0) {
                    licenseBreakdown[skuName] = consumed; // 0 if purchased but no one assigned
                    if (consumed > 0) {
                        totalLicensedUsers += consumed;
                        if (BILLABLE_LICENSE_SKUS.has(sku.skuId)) {
                            billableLicensedUsers += consumed;
                            if (ABOVE_STANDARD_SKUS.has(sku.skuId)) {
                                aboveStandardUsers += consumed;
                            }
                        }
                    }
                }

                // Track provisioned seats for billable SKUs (what they're paying for)
                if (BILLABLE_LICENSE_SKUS.has(sku.skuId) && provisioned > 0) {
                    licenseBreakdownProvisioned[skuName] = provisioned;
                    totalProvisionedSeats += provisioned;
                }
            } else {
                // Non-AMS SKU — capture ALL statuses (informational only, not used for billing)
                // Includes LockedOut, Suspended, etc. so nothing is hidden from the admin view
                const consumed = sku.consumedUnits || 0;
                const provisioned = sku.prepaidUnits?.enabled || 0;
                const partNumber: string = sku.skuPartNumber || sku.skuId;

                if (consumed > 0 || provisioned > 0) {
                    nonAmsSkuIdToPartNumber[sku.skuId] = partNumber;
                    otherLicenseSkuIds[partNumber] = sku.skuId;
                    otherLicenseBreakdown[partNumber] = consumed;
                    if (provisioned > 0) {
                        otherLicenseBreakdownProvisioned[partNumber] = provisioned;
                    }
                }
            }
        }

        // Fetch all users with their assigned licenses to build per-SKU user lists
        const licenseUsers: Record<string, string[]> = {};
        const otherLicenseUsers: Record<string, string[]> = {};
        try {
            let nextUrl: string | null =
                'https://graph.microsoft.com/v1.0/users?$select=displayName,userPrincipalName,assignedLicenses&$top=999';
            while (nextUrl) {
                const usersRes: Response = await fetch(nextUrl, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (!usersRes.ok) throw new Error(await usersRes.text());
                const usersData: any = await usersRes.json();
                for (const user of usersData.value || []) {
                    const label = user.displayName
                        ? `${user.displayName} (${user.userPrincipalName})`
                        : user.userPrincipalName;
                    for (const assigned of user.assignedLicenses || []) {
                        const skuName = AMS_LICENSE_SKUS[assigned.skuId];
                        if (skuName) {
                            if (!licenseUsers[skuName]) licenseUsers[skuName] = [];
                            licenseUsers[skuName].push(label);
                        } else {
                            const partNumber = nonAmsSkuIdToPartNumber[assigned.skuId];
                            if (partNumber) {
                                if (!otherLicenseUsers[partNumber]) otherLicenseUsers[partNumber] = [];
                                otherLicenseUsers[partNumber].push(label);
                            }
                        }
                    }
                }
                nextUrl = usersData['@odata.nextLink'] || null;
            }
        } catch (userFetchErr: any) {
            // Non-fatal: user list is a bonus; snapshot still proceeds without it
            console.warn('Could not fetch user list from Graph API:', userFetchErr.message);
        }

        // Store snapshot
        const { error: insertError } = await (supabase.from('ams_user_snapshots') as any).insert({
            client_id: clientId,
            snapshot_date: new Date().toISOString().split('T')[0],
            total_licensed_users: totalLicensedUsers,
            basic_licensed_users: billableLicensedUsers,       // Standard+ consumed
            premium_licensed_users: aboveStandardUsers,         // Premium/E3/E5 consumed
            total_provisioned_seats: totalProvisionedSeats,     // Standard+ paid for
            license_breakdown: licenseBreakdown,
            license_breakdown_provisioned: licenseBreakdownProvisioned,
            license_users: licenseUsers,
            other_license_breakdown: otherLicenseBreakdown,
            other_license_breakdown_provisioned: otherLicenseBreakdownProvisioned,
            other_license_users: otherLicenseUsers,
            other_license_skuids: otherLicenseSkuIds,
        });

        if (insertError) {
            console.error('Supabase insert error:', insertError);
            return NextResponse.json({ error: insertError.message }, { status: 500 });
        }

        // Update last synced timestamp on client
        await (supabase.from('ams_clients') as any).update({
            m365_last_synced_at: new Date().toISOString(),
        }).eq('id', clientId);

        return NextResponse.json({ success: true, totalLicensedUsers, billableLicensedUsers, aboveStandardUsers, totalProvisionedSeats, licenseBreakdown, licenseBreakdownProvisioned, licenseUsers, otherLicenseBreakdown, otherLicenseBreakdownProvisioned, otherLicenseUsers });

    } catch (err: any) {
        console.error('M365 sync error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
