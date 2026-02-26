-- ========================================================
-- FIX: ALLOW ADMINS TO VIEW ALL PROFILES AND SCORES
-- ========================================================

-- 0. Ensure email column exists on profiles and is populated
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 1. Create a secure helper function to check admin status
-- We use SECURITY DEFINER so that checking the profiles table doesn't trigger 
-- the RLS policy again and cause an infinite loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Allow admins to view all user profiles
DROP POLICY IF EXISTS "Allow admins to view all profiles" ON public.profiles;
CREATE POLICY "Allow admins to view all profiles"
  ON public.profiles FOR SELECT
  USING ( public.is_admin() );

-- 3. Allow admins to view all audit scores
DROP POLICY IF EXISTS "Allow admins to view all scores" ON public.audit_scores;
CREATE POLICY "Allow admins to view all scores"
  ON public.audit_scores FOR SELECT
  USING ( public.is_admin() );

-- 4. Allow admins to view all audit responses
DROP POLICY IF EXISTS "Allow admins to view all responses" ON public.audit_responses;
CREATE POLICY "Allow admins to view all responses"
  ON public.audit_responses FOR SELECT
  USING ( public.is_admin() );
