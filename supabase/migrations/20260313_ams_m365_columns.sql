-- ============================================================
-- AMS M365 OAuth Columns Migration
-- Run once in Supabase SQL Editor to enable M365 integration.
-- ============================================================

-- Add M365 OAuth & sync columns to ams_clients
ALTER TABLE public.ams_clients
  ADD COLUMN IF NOT EXISTS m365_connected        BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS m365_connected_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS m365_access_token     TEXT,
  ADD COLUMN IF NOT EXISTS m365_refresh_token    TEXT,
  ADD COLUMN IF NOT EXISTS m365_token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS m365_last_synced_at   TIMESTAMPTZ;

-- Add basic_licensed_users column to ams_user_snapshots
ALTER TABLE public.ams_user_snapshots
  ADD COLUMN IF NOT EXISTS basic_licensed_users INTEGER DEFAULT 0;
