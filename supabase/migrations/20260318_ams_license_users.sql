-- Add license_users column to ams_user_snapshots
-- Stores a map of license SKU name -> list of assigned user display strings
-- Example: { "Microsoft 365 Business Basic": ["John Smith (john@co.com)", ...] }
ALTER TABLE public.ams_user_snapshots
  ADD COLUMN IF NOT EXISTS license_users JSONB DEFAULT '{}'::jsonb;
