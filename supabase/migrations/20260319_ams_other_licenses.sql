-- Track all non-AMS Microsoft licenses (e.g. Visio, Project, Intune, Defender, Azure AD P2, etc.)
-- Stored separately from AMS-tracked SKUs so the billing logic is unaffected.
ALTER TABLE public.ams_user_snapshots
  ADD COLUMN IF NOT EXISTS other_license_breakdown JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS other_license_breakdown_provisioned JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS other_license_users JSONB DEFAULT '{}'::jsonb;
