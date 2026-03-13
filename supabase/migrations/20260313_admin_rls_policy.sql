-- ==========================================
-- Policy: Allow admins to update any profile
-- This removes the need for a service role key 
-- to manage user admin/BDM status.
-- ==========================================

-- 1. Enable RLS (should already be enabled, but just in case)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for admins
-- Note: We use a subquery to check the caller's admin status.
-- Supabase handles this efficiently with indexed columns.
CREATE POLICY "Admins can update any profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  )
  WITH CHECK (
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true
  );
