-- ============================================
-- Outreach — missing constraints & indexes
-- Run this in Supabase SQL Editor
-- ============================================

-- Unique constraint so we can upsert leads without duplicates per campaign
ALTER TABLE public.outreach_leads
  DROP CONSTRAINT IF EXISTS outreach_leads_campaign_email_unique;

ALTER TABLE public.outreach_leads
  ADD CONSTRAINT outreach_leads_campaign_email_unique
  UNIQUE (campaign_id, contact_email);

-- Index to speed up email-based lookups (used by Instantly webhook)
CREATE INDEX IF NOT EXISTS outreach_leads_email_idx
  ON public.outreach_leads(contact_email);

-- ============================================
-- DONE
-- ============================================
