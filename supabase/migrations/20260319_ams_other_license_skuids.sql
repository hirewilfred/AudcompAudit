-- Store skuId for each non-AMS license so it can be displayed in the UI.
-- Maps skuPartNumber → skuId (GUID).
ALTER TABLE public.ams_user_snapshots
  ADD COLUMN IF NOT EXISTS other_license_skuids JSONB DEFAULT '{}'::jsonb;
