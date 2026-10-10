/*
# Create career journey database tables

## Overview
This migration creates the database schema for the Career Journey (Профразвитие) app.
The app helps Russian students build a career profile, resume, and apply to vacancies.
It is a single-tenant app with no sign-in screen, so all policies allow anon + authenticated access.

## New Tables

### 1. career_profiles
Stores the full user profile as JSONB. The profile is a complex nested structure
(education, opportunity prefs, experiences, skills, soft skills, languages, etc.)
that the app treats as a single unit, so it is stored as JSONB rather than normalized.

- `id` (uuid, primary key) — generated client-side and passed from the frontend
- `profile_data` (jsonb, not null) — the full UserProfile object
- `current_step` (text) — which step of the journey the user is on
- `completed_steps` (text[]) — array of completed step IDs
- `applied_vacancy` (text, nullable) — title of the vacancy the user applied to
- `demo_mode` (boolean, default false) — whether the profile is in demo mode
- `created_at` (timestamptz, default now)
- `updated_at` (timestamptz, default now)

### 2. career_applications
Tracks when a user applies to a vacancy.

- `id` (uuid, primary key, auto-generated)
- `profile_id` (uuid, foreign key to career_profiles.id, on delete cascade)
- `vacancy_title` (text, not null) — title of the applied vacancy
- `company` (text) — company name
- `cover_letter` (text) — the generated/edited cover letter text
- `readiness_score` (integer) — readiness percentage at time of application
- `created_at` (timestamptz, default now)

## Security
- RLS enabled on both tables.
- All CRUD policies use `TO anon, authenticated` since this is a no-auth single-tenant app.
- `USING (true)` / `WITH CHECK (true)` is acceptable here because the data is intentionally
  shared/public (no sign-in screen, no user isolation needed).

## Important Notes
1. The app generates a UUID client-side and stores it in localStorage to identify its profile row.
2. On first load, the app creates a row in career_profiles. On subsequent loads, it reads/updates that row.
3. When the user applies to a vacancy, a row is inserted into career_applications.
4. No auth is required — the anon key client can read and write all rows.
*/

-- ─── career_profiles ───
CREATE TABLE IF NOT EXISTS career_profiles (
  id uuid PRIMARY KEY,
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  current_step text NOT NULL DEFAULT 'welcome',
  completed_steps text[] NOT NULL DEFAULT '{}',
  applied_vacancy text,
  demo_mode boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE career_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_career_profiles" ON career_profiles;
CREATE POLICY "anon_select_career_profiles" ON career_profiles FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_career_profiles" ON career_profiles;
CREATE POLICY "anon_insert_career_profiles" ON career_profiles FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_career_profiles" ON career_profiles;
CREATE POLICY "anon_update_career_profiles" ON career_profiles FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_career_profiles" ON career_profiles;
CREATE POLICY "anon_delete_career_profiles" ON career_profiles FOR DELETE
  TO anon, authenticated USING (true);

-- ─── career_applications ───
CREATE TABLE IF NOT EXISTS career_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES career_profiles(id) ON DELETE CASCADE,
  vacancy_title text NOT NULL,
  company text,
  cover_letter text,
  readiness_score integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE career_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_career_applications" ON career_applications;
CREATE POLICY "anon_select_career_applications" ON career_applications FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_career_applications" ON career_applications;
CREATE POLICY "anon_insert_career_applications" ON career_applications FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_career_applications" ON career_applications;
CREATE POLICY "anon_update_career_applications" ON career_applications FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_career_applications" ON career_applications;
CREATE POLICY "anon_delete_career_applications" ON career_applications FOR DELETE
  TO anon, authenticated USING (true);

-- Index for looking up applications by profile
CREATE INDEX IF NOT EXISTS idx_career_applications_profile_id ON career_applications(profile_id);

-- ─── updated_at trigger ───
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_career_profiles_updated_at ON career_profiles;
CREATE TRIGGER trg_career_profiles_updated_at
  BEFORE UPDATE ON career_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();