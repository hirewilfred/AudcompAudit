-- Track provisioned (purchased) seats alongside consumed seats for billable SKUs.
-- Unused seats = total_provisioned_seats - basic_licensed_users (billable consumed).
ALTER TABLE public.ams_user_snapshots
  ADD COLUMN IF NOT EXISTS total_provisioned_seats INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS license_breakdown_provisioned JSONB DEFAULT '{}'::jsonb;
