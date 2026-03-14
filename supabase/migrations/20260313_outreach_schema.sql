-- ============================================
-- AI OUTREACH AUTOMATION — Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. outreach_campaigns
CREATE TABLE IF NOT EXISTS public.outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ams_client_id UUID REFERENCES public.ams_clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft', -- draft|active|paused|completed
  icp_config JSONB DEFAULT '{}',         -- { industries, company_size, geography, title_targets }
  email_templates JSONB DEFAULT '[]',    -- [{ step, subject, body, delay_days }]
  max_follow_ups INTEGER DEFAULT 3,
  sequence_interval_days INTEGER DEFAULT 3,
  stats_researched INTEGER DEFAULT 0,
  stats_contacted INTEGER DEFAULT 0,
  stats_replied INTEGER DEFAULT 0,
  stats_interested INTEGER DEFAULT 0,
  stats_booked INTEGER DEFAULT 0,
  stats_closed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_outreach_campaigns_updated_at ON public.outreach_campaigns;
CREATE TRIGGER set_outreach_campaigns_updated_at
  BEFORE UPDATE ON public.outreach_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. outreach_leads
CREATE TABLE IF NOT EXISTS public.outreach_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_title TEXT,
  contact_linkedin TEXT,
  company_domain TEXT,
  company_industry TEXT,
  company_size TEXT,
  company_location TEXT,
  status TEXT NOT NULL DEFAULT 'researched',
  -- researched|contacted|replied|interested|booked|closed|disqualified
  source TEXT,
  researched_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  interested_at TIMESTAMPTZ,
  booked_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  last_touch_at TIMESTAMPTZ,
  next_action_at TIMESTAMPTZ,
  next_action_note TEXT,
  follow_up_count INTEGER DEFAULT 0,
  meeting_booked_at TIMESTAMPTZ,
  meeting_url TEXT,
  assigned_rep TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_outreach_leads_updated_at ON public.outreach_leads;
CREATE TRIGGER set_outreach_leads_updated_at
  BEFORE UPDATE ON public.outreach_leads
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. outreach_agent_events (append-only log)
CREATE TABLE IF NOT EXISTS public.outreach_agent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.outreach_campaigns(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.outreach_leads(id) ON DELETE SET NULL,
  agent_id TEXT NOT NULL,
  agent_display_name TEXT,
  event_type TEXT NOT NULL,
  summary TEXT,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success', -- success|error|warning
  occurred_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS outreach_leads_campaign_id_idx ON public.outreach_leads(campaign_id);
CREATE INDEX IF NOT EXISTS outreach_leads_status_idx ON public.outreach_leads(status);
CREATE INDEX IF NOT EXISTS outreach_agent_events_campaign_id_idx ON public.outreach_agent_events(campaign_id);
CREATE INDEX IF NOT EXISTS outreach_agent_events_occurred_at_idx ON public.outreach_agent_events(occurred_at DESC);

-- RLS
ALTER TABLE public.outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outreach_agent_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage outreach campaigns" ON public.outreach_campaigns;
CREATE POLICY "Admins can manage outreach campaigns" ON public.outreach_campaigns
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage outreach leads" ON public.outreach_leads;
CREATE POLICY "Admins can manage outreach leads" ON public.outreach_leads
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage outreach agent events" ON public.outreach_agent_events;
CREATE POLICY "Admins can manage outreach agent events" ON public.outreach_agent_events
  FOR ALL USING (public.is_admin());

-- ============================================
-- DONE
-- ============================================
