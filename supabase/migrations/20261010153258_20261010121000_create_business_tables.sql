/*
# Create business tables: vacancies, projects, documents, events

## Overview
Creates vacancy postings, business projects, business documents, and their event logs.

## New Tables
### vacancies — job postings with moderation workflow
### vacancy_events — vacancy lifecycle event log
### business_projects — service/advertising projects
### business_project_events — project lifecycle event log
### business_documents — documents tied to organizations/projects

## Security
- RLS enabled on all tables.
- Vacancies: published visible to all authenticated; org members see all their vacancies.
- Projects: org members can see their projects; admins see all.
- Documents: org members can access; admins see all.
- Events: readable by org members who can access the parent entity.

## Important Notes
1. Money amounts stored in kopecks (bigint).
2. Vacancy moderation: draft → pending_moderation → approved → published.
*/

-- ─── vacancies ───
CREATE TABLE IF NOT EXISTS vacancies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  responsibilities text[] NOT NULL DEFAULT '{}',
  requirements text[] NOT NULL DEFAULT '{}',
  nice_to_have text[] NOT NULL DEFAULT '{}',
  employment_type text NOT NULL DEFAULT 'Полная',
  schedule text NOT NULL DEFAULT 'Полный день',
  work_format text NOT NULL DEFAULT 'Офис',
  location text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  salary_from integer,
  salary_to integer,
  salary_currency text NOT NULL DEFAULT 'RUB',
  salary_gross boolean NOT NULL DEFAULT true,
  experience_level text NOT NULL DEFAULT 'none',
  skills text[] NOT NULL DEFAULT '{}',
  suitable_for_minors boolean NOT NULL DEFAULT false,
  minimum_age integer,
  contact_person text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_moderation','approved','published','paused','rejected','closed','archived')),
  moderation_comment text NOT NULL DEFAULT '',
  moderated_by text,
  moderated_at timestamptz,
  published_at timestamptz,
  closed_at timestamptz,
  promotion jsonb,
  advertiser_name text NOT NULL DEFAULT '',
  advertiser_inn text NOT NULL DEFAULT '',
  erid text NOT NULL DEFAULT '',
  ord_provider text NOT NULL DEFAULT '',
  ad_label_required boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES platform_accounts(id),
  views integer NOT NULL DEFAULT 0,
  applications_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vacancies ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vacancies_org ON vacancies(organization_id);
CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status);
CREATE INDEX IF NOT EXISTS idx_vacancies_created_by ON vacancies(created_by);

DROP POLICY IF EXISTS "select_vacancies" ON vacancies;
CREATE POLICY "select_vacancies" ON vacancies FOR SELECT
  TO authenticated USING (
    status = 'published'
    OR is_platform_admin()
    OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "insert_vacancies" ON vacancies;
CREATE POLICY "insert_vacancies" ON vacancies FOR INSERT
  TO authenticated WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "update_vacancies" ON vacancies;
CREATE POLICY "update_vacancies" ON vacancies FOR UPDATE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  ) WITH CHECK (
    is_platform_admin() OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "delete_vacancies" ON vacancies;
CREATE POLICY "delete_vacancies" ON vacancies FOR DELETE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  );

-- ─── vacancy_events ───
CREATE TABLE IF NOT EXISTS vacancy_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vacancy_id uuid NOT NULL REFERENCES vacancies(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT '',
  actor_account_id uuid,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE vacancy_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_vacancy_events_vacancy ON vacancy_events(vacancy_id);

DROP POLICY IF EXISTS "select_vacancy_events" ON vacancy_events;
CREATE POLICY "select_vacancy_events" ON vacancy_events FOR SELECT
  TO authenticated USING (
    is_platform_admin() OR is_org_member(
      (SELECT organization_id FROM vacancies WHERE id = vacancy_id)
    )
  );

DROP POLICY IF EXISTS "insert_vacancy_events" ON vacancy_events;
CREATE POLICY "insert_vacancy_events" ON vacancy_events FOR INSERT
  TO authenticated WITH CHECK (
    is_platform_admin() OR is_org_member(
      (SELECT organization_id FROM vacancies WHERE id = vacancy_id)
    )
  );

-- ─── business_projects ───
CREATE TABLE IF NOT EXISTS business_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_number text UNIQUE NOT NULL DEFAULT '',
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'other',
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','calculated','documents','payment_pending','paid','in_progress','completed','cancelled')),
  provider_amount_kopecks bigint NOT NULL DEFAULT 0,
  platform_fee_kopecks bigint NOT NULL DEFAULT 0,
  total_amount_kopecks bigint NOT NULL DEFAULT 0,
  pricing_version text,
  brief jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES platform_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_projects ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_projects_org ON business_projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON business_projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON business_projects(created_by);

DROP POLICY IF EXISTS "select_projects" ON business_projects;
CREATE POLICY "select_projects" ON business_projects FOR SELECT
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "insert_projects" ON business_projects;
CREATE POLICY "insert_projects" ON business_projects FOR INSERT
  TO authenticated WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "update_projects" ON business_projects;
CREATE POLICY "update_projects" ON business_projects FOR UPDATE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  ) WITH CHECK (
    is_platform_admin() OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "delete_projects" ON business_projects;
CREATE POLICY "delete_projects" ON business_projects FOR DELETE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  );

-- ─── business_project_events ───
CREATE TABLE IF NOT EXISTS business_project_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES business_projects(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT '',
  actor_account_id uuid,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_project_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_project_events_project ON business_project_events(project_id);

DROP POLICY IF EXISTS "select_project_events" ON business_project_events;
CREATE POLICY "select_project_events" ON business_project_events FOR SELECT
  TO authenticated USING (
    is_platform_admin() OR is_org_member(
      (SELECT organization_id FROM business_projects WHERE id = project_id)
    )
  );

DROP POLICY IF EXISTS "insert_project_events" ON business_project_events;
CREATE POLICY "insert_project_events" ON business_project_events FOR INSERT
  TO authenticated WITH CHECK (
    is_platform_admin() OR is_org_member(
      (SELECT organization_id FROM business_projects WHERE id = project_id)
    )
  );

-- ─── business_documents ───
CREATE TABLE IF NOT EXISTS business_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  project_id uuid REFERENCES business_projects(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'contract' CHECK (type IN ('contract','invoice','act','appendix','commercial_offer','brief')),
  number text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ready','signed','cancelled')),
  amount integer,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE business_documents ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_documents_org ON business_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_project ON business_documents(project_id);

DROP POLICY IF EXISTS "select_documents" ON business_documents;
CREATE POLICY "select_documents" ON business_documents FOR SELECT
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "insert_documents" ON business_documents;
CREATE POLICY "insert_documents" ON business_documents FOR INSERT
  TO authenticated WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "update_documents" ON business_documents;
CREATE POLICY "update_documents" ON business_documents FOR UPDATE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  ) WITH CHECK (
    is_platform_admin() OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "delete_documents" ON business_documents;
CREATE POLICY "delete_documents" ON business_documents FOR DELETE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  );

-- ─── updated_at triggers ───
DROP TRIGGER IF EXISTS trg_vacancies_updated_at ON vacancies;
CREATE TRIGGER trg_vacancies_updated_at
  BEFORE UPDATE ON vacancies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_projects_updated_at ON business_projects;
CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON business_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_documents_updated_at ON business_documents;
CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON business_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();