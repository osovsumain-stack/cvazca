/*
# Create application & resume tables: job_applications, application_events, resumes, favorite_vacancies, career_test_results

## Overview
Creates tables for job applications, application event logs, candidate resumes,
favorite vacancies, and career test results.

## New Tables
### job_applications — tracks candidate applications to vacancies
### application_events — event log for application status changes
### resumes — candidate resumes (multiple per candidate, public/private)
### favorite_vacancies — candidate's favorite vacancy bookmarks
### career_test_results — stored results of career tests

## Security
- RLS enabled on all tables.
- Applications: candidates see their own; org members see applications for their vacancies.
- Resumes: candidates CRUD their own; public resumes visible to all authenticated.
- Favorites: users CRUD their own.
- Career test results: users CRUD their own.

## Important Notes
1. Public resume access controlled by is_public flag + public_slug.
2. Job applications reference both vacancies and platform_accounts.
*/

-- ─── job_applications ───
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id uuid NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  resume_id uuid,
  cover_letter text NOT NULL DEFAULT '',
  readiness_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('draft','sent','viewed','interview','offer','rejected','withdrawn')),
  shared_contacts jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_applications_vacancy ON job_applications(vacancy_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON job_applications(candidate_id);

DROP POLICY IF EXISTS "select_applications" ON job_applications;
CREATE POLICY "select_applications" ON job_applications FOR SELECT
  TO authenticated USING (
    candidate_id = auth.uid()
    OR is_platform_admin()
    OR is_org_member(
      (SELECT organization_id FROM vacancies WHERE id = job_applications.vacancy_id)
    )
  );

DROP POLICY IF EXISTS "insert_applications" ON job_applications;
CREATE POLICY "insert_applications" ON job_applications FOR INSERT
  TO authenticated WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "update_applications" ON job_applications;
CREATE POLICY "update_applications" ON job_applications FOR UPDATE
  TO authenticated USING (
    candidate_id = auth.uid()
    OR is_platform_admin()
    OR is_org_member(
      (SELECT organization_id FROM vacancies WHERE id = job_applications.vacancy_id)
    )
  ) WITH CHECK (
    candidate_id = auth.uid()
    OR is_platform_admin()
    OR is_org_member(
      (SELECT organization_id FROM vacancies WHERE id = job_applications.vacancy_id)
    )
  );

DROP POLICY IF EXISTS "delete_applications" ON job_applications;
CREATE POLICY "delete_applications" ON job_applications FOR DELETE
  TO authenticated USING (candidate_id = auth.uid());

-- ─── application_events ───
CREATE TABLE IF NOT EXISTS application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT '',
  actor_account_id uuid,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_app_events_application ON application_events(application_id);

DROP POLICY IF EXISTS "select_app_events" ON application_events;
CREATE POLICY "select_app_events" ON application_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM job_applications a WHERE a.id = application_id AND a.candidate_id = auth.uid())
    OR is_platform_admin()
    OR is_org_member(
      (SELECT v.organization_id FROM vacancies v
       JOIN job_applications a ON a.vacancy_id = v.id
       WHERE a.id = application_id)
    )
  );

DROP POLICY IF EXISTS "insert_app_events" ON application_events;
CREATE POLICY "insert_app_events" ON application_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM job_applications a WHERE a.id = application_id AND a.candidate_id = auth.uid())
    OR is_platform_admin()
    OR is_org_member(
      (SELECT v.organization_id FROM vacancies v
       JOIN job_applications a ON a.vacancy_id = v.id
       WHERE a.id = application_id)
    )
  );

-- ─── resumes ───
CREATE TABLE IF NOT EXISTS resumes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  target_position text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  experience_ids text[] NOT NULL DEFAULT '{}',
  education_included boolean NOT NULL DEFAULT true,
  skills text[] NOT NULL DEFAULT '{}',
  is_public boolean NOT NULL DEFAULT false,
  public_slug text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  visibility jsonb NOT NULL DEFAULT '{"showEmail":false,"showPhone":false,"showCity":true,"showExperience":true}'::jsonb,
  moderation_status text NOT NULL DEFAULT 'not_submitted' CHECK (moderation_status IN ('pending','approved','rejected','not_submitted')),
  experiences jsonb NOT NULL DEFAULT '[]'::jsonb,
  education_entries jsonb NOT NULL DEFAULT '[]'::jsonb,
  languages jsonb NOT NULL DEFAULT '[]'::jsonb,
  portfolio_links text[] NOT NULL DEFAULT '{}',
  desired_salary integer,
  employment_types text[] NOT NULL DEFAULT '{}',
  work_formats text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_resumes_candidate ON resumes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resumes_public_slug ON resumes(public_slug);

DROP POLICY IF EXISTS "select_resumes" ON resumes;
CREATE POLICY "select_resumes" ON resumes FOR SELECT
  TO authenticated USING (
    candidate_id = auth.uid()
    OR is_platform_admin()
    OR (is_public = true)
    OR EXISTS (
      SELECT 1 FROM job_applications a
      WHERE a.resume_id = resumes.id
      AND a.status != 'withdrawn'
      AND is_org_member(
        (SELECT organization_id FROM vacancies WHERE id = a.vacancy_id)
      )
    )
  );

DROP POLICY IF EXISTS "insert_resumes" ON resumes;
CREATE POLICY "insert_resumes" ON resumes FOR INSERT
  TO authenticated WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "update_resumes" ON resumes;
CREATE POLICY "update_resumes" ON resumes FOR UPDATE
  TO authenticated USING (candidate_id = auth.uid()) WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "delete_resumes" ON resumes;
CREATE POLICY "delete_resumes" ON resumes FOR DELETE
  TO authenticated USING (candidate_id = auth.uid());

-- ─── favorite_vacancies ───
CREATE TABLE IF NOT EXISTS favorite_vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  vacancy_id uuid NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, vacancy_id)
);

ALTER TABLE favorite_vacancies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_favorites_account ON favorite_vacancies(account_id);

DROP POLICY IF EXISTS "select_own_favorites" ON favorite_vacancies;
CREATE POLICY "select_own_favorites" ON favorite_vacancies FOR SELECT
  TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_favorites" ON favorite_vacancies;
CREATE POLICY "insert_own_favorites" ON favorite_vacancies FOR INSERT
  TO authenticated WITH CHECK (account_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_favorites" ON favorite_vacancies;
CREATE POLICY "delete_own_favorites" ON favorite_vacancies FOR DELETE
  TO authenticated USING (account_id = auth.uid());

-- ─── career_test_results ───
CREATE TABLE IF NOT EXISTS career_test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  test_type text NOT NULL CHECK (test_type IN ('career_interests','work_style','career_priorities')),
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile_name text NOT NULL DEFAULT '',
  scoring_version text NOT NULL DEFAULT '',
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  taken_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, test_type)
);

ALTER TABLE career_test_results ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_test_results_account ON career_test_results(account_id);

DROP POLICY IF EXISTS "select_own_test_results" ON career_test_results;
CREATE POLICY "select_own_test_results" ON career_test_results FOR SELECT
  TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_test_results" ON career_test_results;
CREATE POLICY "insert_own_test_results" ON career_test_results FOR INSERT
  TO authenticated WITH CHECK (account_id = auth.uid());

DROP POLICY IF EXISTS "update_own_test_results" ON career_test_results;
CREATE POLICY "update_own_test_results" ON career_test_results FOR UPDATE
  TO authenticated USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_test_results" ON career_test_results;
CREATE POLICY "delete_own_test_results" ON career_test_results FOR DELETE
  TO authenticated USING (account_id = auth.uid());

-- ─── updated_at triggers ───
DROP TRIGGER IF EXISTS trg_applications_updated_at ON job_applications;
CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_resumes_updated_at ON resumes;
CREATE TRIGGER trg_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();