-- ==========================================
-- MASTER SETUP SCRIPT FOR AI AUDIT ADMIN
-- ==========================================

-- 1. Ensure 'is_admin' column exists in profiles
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='assigned_expert_id') THEN
        ALTER TABLE public.profiles ADD COLUMN assigned_expert_id UUID REFERENCES public.experts(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_bdm') THEN
        ALTER TABLE public.profiles ADD COLUMN is_bdm BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Create experts table
CREATE TABLE IF NOT EXISTS public.experts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  linkedin_url TEXT,
  bookings_url TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on experts
ALTER TABLE public.experts ENABLE ROW LEVEL SECURITY;

-- 4. Set up Policies for Experts
DROP POLICY IF EXISTS "Allow public read-only access to experts" ON public.experts;
CREATE POLICY "Allow public read-only access to experts" ON public.experts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow admins to manage experts" ON public.experts;
CREATE POLICY "Allow admins to manage experts" ON public.experts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = true
    )
  );

-- 5. Ensure Storage Bucket for Experts exists
-- Note: Creating buckets via SQL is specific to Supabase
INSERT INTO storage.buckets (id, name, public) 
VALUES ('experts', 'experts', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for storage
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'experts');
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'experts' AND 
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 6. ACTIVATE ADMIN ACCOUNT
-- This ensures the admin@admin.com account has access
UPDATE public.profiles 
SET is_admin = true, has_completed_audit = true
WHERE id IN (
  SELECT id FROM auth.users WHERE email IN ('admin@admin.com', 'vgreco@me.com')
);

-- ==========================================
-- SETUP COMPLETE
-- ==========================================
