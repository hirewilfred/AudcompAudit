-- ============================================
-- AMS CLIENT PORTAL DATABASE SETUP
-- ============================================

-- 1. AMS Clients table
CREATE TABLE IF NOT EXISTS public.ams_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  users_contracted INTEGER NOT NULL DEFAULT 0,
  price_per_user NUMERIC(10, 2) NOT NULL DEFAULT 0,
  m365_tenant_id TEXT,
  m365_client_id TEXT,
  m365_client_secret TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AMS User Snapshots (synced from M365)
CREATE TABLE IF NOT EXISTS public.ams_user_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.ams_clients(id) ON DELETE CASCADE,
  snapshot_date DATE DEFAULT CURRENT_DATE,
  total_licensed_users INTEGER DEFAULT 0,
  license_breakdown JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.ams_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ams_user_snapshots ENABLE ROW LEVEL SECURITY;

-- 4. Admin-only policies (reuses the is_admin() function)
DROP POLICY IF EXISTS "Admins can manage AMS clients" ON public.ams_clients;
CREATE POLICY "Admins can manage AMS clients" ON public.ams_clients
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage AMS snapshots" ON public.ams_user_snapshots;
CREATE POLICY "Admins can manage AMS snapshots" ON public.ams_user_snapshots
  FOR ALL USING (public.is_admin());

-- ============================================
-- DONE
-- ============================================
