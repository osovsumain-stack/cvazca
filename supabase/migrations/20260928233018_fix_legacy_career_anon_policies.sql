-- ─── Fix legacy career tables: remove dangerous anon access policies ───
-- The original migration created career_profiles and career_applications
-- with `TO anon, authenticated USING (true) WITH CHECK (true)` policies,
-- which allowed ANY anon client to read/modify ALL career profiles.
-- This is no longer acceptable — the platform now uses VK ID accounts.
--
-- These tables are marked LEGACY/DEV. The new Career UI uses a
-- client-side repository DEV adapter, NOT these Supabase tables.
-- In production, career data will use proper RLS with auth.uid() checks.
--
-- We remove the anon policies here. Only authenticated access remains
-- as a transitional measure until the production career schema is deployed.

-- Drop all anon policies on career_profiles
DROP POLICY IF EXISTS "anon_select_career_profiles" ON career_profiles;
DROP POLICY IF EXISTS "anon_insert_career_profiles" ON career_profiles;
DROP POLICY IF EXISTS "anon_update_career_profiles" ON career_profiles;
DROP POLICY IF EXISTS "anon_delete_career_profiles" ON career_profiles;

-- Drop all anon policies on career_applications
DROP POLICY IF EXISTS "anon_select_career_applications" ON career_applications;
DROP POLICY IF EXISTS "anon_insert_career_applications" ON career_applications;
DROP POLICY IF EXISTS "anon_update_career_applications" ON career_applications;
DROP POLICY IF EXISTS "anon_delete_career_applications" ON career_applications;

-- Note: We do NOT add new policies here. These tables are LEGACY.
-- The new Career UI does not use these tables.
-- When production career schema is deployed, it will use auth.uid()-based RLS.