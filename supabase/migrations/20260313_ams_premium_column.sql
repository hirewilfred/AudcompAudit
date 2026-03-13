-- Add premium_licensed_users column to ams_user_snapshots
ALTER TABLE public.ams_user_snapshots
  ADD COLUMN IF NOT EXISTS premium_licensed_users INTEGER DEFAULT 0;
