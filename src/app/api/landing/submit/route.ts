import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service role — this endpoint is PUBLIC by design (form submissions),
// so we bypass RLS but never expose secrets.
const adminSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const ALLOWED_SLUGS = new Set([
    'free-ai-audit',
    'ai-receptionist',
    'custom-ai-agents',
    'ai-training',
    'audcomp-360',
]);

interface SubmitPayload {
    landing_page_slug: string;
    email: string;
    full_name?: string;
    organization?: string;
    phone?: string;
    referrer?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    audit_user_id?: string | null;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as SubmitPayload;
        const slug = (body.landing_page_slug || '').trim();
        const email = (body.email || '').trim().toLowerCase();

        if (!slug || !ALLOWED_SLUGS.has(slug)) {
            return NextResponse.json({ error: 'Unknown landing_page_slug' }, { status: 400 });
        }
        if (!email || !isEmail(email)) {
            return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
        }

        // ── 1. Round-robin assignment via pick_next_expert() ──────────────
        let assignedExpertId: string | null = null;
        try {
            const { data: pickData, error: pickErr } = await (adminSupabase as any).rpc('pick_next_expert');
            if (!pickErr) assignedExpertId = (pickData as string | null) ?? null;
        } catch (e) {
            console.warn('[landing/submit] pick_next_expert failed', e);
        }

        // ── 2. Insert the canonical submission row ────────────────────────
        const submissionPayload = {
            landing_page_slug: slug,
            email,
            full_name: body.full_name?.trim() || null,
            organization: body.organization?.trim() || null,
            phone: body.phone?.trim() || null,
            referrer: body.referrer || null,
            utm_source: body.utm_source || null,
            utm_medium: body.utm_medium || null,
            utm_campaign: body.utm_campaign || null,
            utm_term: body.utm_term || null,
            utm_content: body.utm_content || null,
            assigned_expert_id: assignedExpertId,
            audit_user_id: body.audit_user_id ?? null,
        };

        const { data: submission, error: subErr } = await (adminSupabase as any)
            .from('landing_page_submissions')
            .insert(submissionPayload)
            .select('id')
            .single();

        if (subErr) {
            console.error('[landing/submit] submission insert failed', subErr);
            return NextResponse.json({ error: subErr.message }, { status: 500 });
        }

        // ── 3. Mirror into outreach_leads so the expert sees them in their queue
        // We don't have an outreach_campaigns row required (existing schema makes
        // campaign_id NOT NULL). If there's an "Inbound — <slug>" auto-campaign
        // for the assigned expert, attach to it. Otherwise create one.
        let leadId: string | null = null;
        if (assignedExpertId) {
            const inboundName = `Inbound — ${slug}`;
            const { data: existingCampaign } = await (adminSupabase as any)
                .from('outreach_campaigns')
                .select('id')
                .eq('expert_id', assignedExpertId)
                .eq('name', inboundName)
                .maybeSingle();

            let campaignId = existingCampaign?.id as string | undefined;
            if (!campaignId) {
                const { data: newCampaign, error: campErr } = await (adminSupabase as any)
                    .from('outreach_campaigns')
                    .insert({
                        name: inboundName,
                        expert_id: assignedExpertId,
                        status: 'active',
                        channel: 'multi',
                        landing_page_slug: slug,
                    })
                    .select('id')
                    .single();
                if (campErr) {
                    console.warn('[landing/submit] inbound campaign create failed', campErr);
                } else {
                    campaignId = newCampaign?.id;
                }
            }

            if (campaignId) {
                const { data: lead, error: leadErr } = await (adminSupabase as any)
                    .from('outreach_leads')
                    .insert({
                        campaign_id: campaignId,
                        expert_id: assignedExpertId,
                        contact_name: submissionPayload.full_name,
                        contact_email: email,
                        company_name: submissionPayload.organization,
                        source: 'landing_page',
                        landing_page_slug: slug,
                        audit_user_id: submissionPayload.audit_user_id,
                        approval_status: 'pending_review',
                    })
                    .select('id')
                    .single();
                if (leadErr) {
                    // Likely a uniqueness violation if the same email already in this campaign — ignore
                    console.warn('[landing/submit] lead insert skipped', leadErr.code, leadErr.message);
                } else {
                    leadId = lead?.id ?? null;
                }
            }
        }

        return NextResponse.json({
            ok: true,
            submission_id: submission.id,
            assigned_expert_id: assignedExpertId,
            lead_id: leadId,
        });
    } catch (err: any) {
        console.error('[landing/submit] error', err);
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
