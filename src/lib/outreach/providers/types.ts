// Shared shape every provider adapter implements.
// New providers = new file in this folder + add to registry.

export interface PushLead {
    id: string;              // outreach_leads.id
    email: string;
    first_name?: string | null;
    last_name?: string | null;
    company?: string | null;
    title?: string | null;
    linkedin_url?: string | null;
    custom?: Record<string, any>;
}

export interface PushResult {
    pushed: number;
    skipped: number;
    failed: number;
    errors: Array<{ leadId: string; error: string }>;
    providerCampaignId?: string;
}

export interface ProviderStats {
    contacted: number;
    opened: number;
    replied: number;
    booked: number;
    bounced: number;
}

export interface OutreachProvider {
    name: string;
    pushLeads(args: {
        providerCampaignId?: string;     // existing remote campaign
        campaignName?: string;           // for create-on-the-fly
        senderEmail?: string;            // per-expert sending domain
        leads: PushLead[];
    }): Promise<PushResult>;
    pauseCampaign(providerCampaignId: string): Promise<void>;
    resumeCampaign(providerCampaignId: string): Promise<void>;
    fetchStats(providerCampaignId: string): Promise<ProviderStats>;
    testConnection(): Promise<{ ok: boolean; error?: string }>;
}
