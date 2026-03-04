import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// AMS-relevant M365 license SKUs
const AMS_LICENSE_SKUS: Record<string, string> = {
    'f30db892-07e9-47e9-837c-80727f46fd3d': 'Microsoft 365 F1',
    '66b55226-6b4f-492c-910c-a3b7a3c9d993': 'Microsoft 365 F3',
    'b05e124f-c7cc-45a0-a6aa-8cf78c946968': 'Microsoft 365 Business Basic',
    'cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46': 'Microsoft 365 Business Premium',
    'f245ecc8-75af-4f8e-b61f-27d8114de5f3': 'Microsoft 365 Business Standard',
    '05e9a617-0261-4cee-bb44-138d3ef5d965': 'Microsoft 365 E3',
    '06ebc4ee-1bb5-47dd-8120-11324bc54e06': 'Microsoft 365 E5',
    '18181a46-0d4e-45cd-891e-60aabd171b4e': 'Office 365 E1',
    '6fd2c87f-b296-42f0-b197-1e91e994b900': 'Office 365 E3',
    'c7df2760-2c81-4ef7-b578-5b5392b571df': 'Office 365 E5',
};

export async function POST(req: NextRequest) {
    try {
        const { clientId } = await req.json();
        if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

        // Use the public env vars — RLS policies handle admin-only access
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Fetch client M365 credentials
        const { data: client, error: clientError } = await supabase
            .from('ams_clients')
            .select('m365_tenant_id, m365_client_id, m365_client_secret')
            .eq('id', clientId)
            .single();

        if (clientError || !client?.m365_tenant_id) {
            return NextResponse.json({ error: 'Client not found or missing M365 credentials' }, { status: 404 });
        }

        const { m365_tenant_id, m365_client_id, m365_client_secret } = client;

        // Step 1: Get access token from Microsoft
        const tokenRes = await fetch(
            `https://login.microsoftonline.com/${m365_tenant_id}/oauth2/v2.0/token`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: m365_client_id,
                    client_secret: m365_client_secret,
                    scope: 'https://graph.microsoft.com/.default',
                }),
            }
        );

        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            return NextResponse.json({ error: 'Failed to get M365 token', detail: err }, { status: 400 });
        }

        const { access_token } = await tokenRes.json();

        // Step 2: Get subscribed SKUs (license counts from tenant)
        const skuRes = await fetch(
            'https://graph.microsoft.com/v1.0/subscribedSkus',
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        if (!skuRes.ok) {
            return NextResponse.json({ error: 'Failed to fetch SKUs from Graph API' }, { status: 400 });
        }

        const { value: skus } = await skuRes.json();

        // Step 3: Count AMS-relevant assigned licenses
        let totalLicensedUsers = 0;
        const licenseBreakdown: Record<string, number> = {};

        for (const sku of skus) {
            const skuName = AMS_LICENSE_SKUS[sku.skuId];
            if (skuName) {
                const count = sku.consumedUnits || 0;
                if (count > 0) {
                    licenseBreakdown[skuName] = count;
                    totalLicensedUsers += count;
                }
            }
        }

        // Step 4: Store snapshot in Supabase
        await supabase.from('ams_user_snapshots').insert({
            client_id: clientId,
            snapshot_date: new Date().toISOString().split('T')[0],
            total_licensed_users: totalLicensedUsers,
            license_breakdown: licenseBreakdown,
        });

        return NextResponse.json({
            success: true,
            totalLicensedUsers,
            licenseBreakdown,
        });

    } catch (err: any) {
        console.error('M365 sync error:', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
