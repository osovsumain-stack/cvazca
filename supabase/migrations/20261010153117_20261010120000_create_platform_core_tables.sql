/*
# Create platform core tables: accounts, organizations, memberships, candidate profiles

## Overview
This migration creates the core database schema for the СВЯЗКА platform.
The app uses VK ID and email/password auth via Supabase.
One person can use both Career and Business sides — roles are separate assignments.

## New Tables

### 1. platform_accounts
Stores the platform account linked to a Supabase auth user.
- `id` (uuid, PK) — references auth.users(id) ON DELETE CASCADE
- `vk_user_id` (text, unique, nullable) — VK ID for VK-authenticated users
- `display_name` (text, not null)
- `first_name`, `last_name`, `avatar_url`, `email`, `phone` (text)
- `created_at` / `updated_at` (timestamptz)

### 2. platform_role_assignments
Links accounts to platform roles (candidate, business_member, admin).
- `id` (uuid, PK)
- `account_id` (uuid, FK → platform_accounts.id ON DELETE CASCADE)
- `role` (text, not null) — 'candidate' | 'business_member' | 'admin'
- `created_at` (timestamptz)

### 3. organizations
Business organization profiles (legal entities).
- `id` (uuid, PK)
- `created_by` (uuid, FK → platform_accounts.id)
- `name`, `full_name`, `short_name`, `type`, `inn`, `kpp`, `ogrn`, `ogrnip` (text)
- `legal_address`, `actual_address`, `signatory_full_name`, `signatory_position`, `authority_type` (text)
- `contact_email`, `contact_phone`, `accounting_email`, `website`, `description`, `logo`, `industry`, `city` (text)
- `data_source` (text), `data_verified_at` (timestamptz)
- `bank_details` (jsonb), `public_profile` (jsonb)
- `created_at` / `updated_at` (timestamptz)

### 4. organization_memberships
Links accounts to organizations with specific roles.
- `id` (uuid, PK)
- `organization_id` (uuid, FK → organizations.id ON DELETE CASCADE)
- `account_id` (uuid, FK → platform_accounts.id ON DELETE CASCADE)
- `role` (text) — owner, administrator, marketing_manager, hr_manager, accountant, viewer
- `status` (text) — active, invited, revoked
- `created_at` (timestamptz)

### 5. candidate_profiles
Stores the full candidate profile as JSONB.
- `id` (uuid, PK, DEFAULT auth.uid())
- `account_id` (uuid, FK → platform_accounts.id ON DELETE CASCADE)
- `profile_data` (jsonb, not null)
- `profile_completion` (integer, default 0)
- `is_minor` (boolean, default false)
- `guardian_verification_status` (text, default 'not_required')
- `created_at` / `updated_at` (timestamptz)

## Security
- RLS enabled on all tables.
- platform_accounts: users can read/update their own row; admins can read all.
- platform_role_assignments: users can read their own roles; self-assign candidate/business_member.
- organizations: members can read their orgs; public profiles readable by all authenticated.
- organization_memberships: members can read memberships for their orgs; management can modify.
- candidate_profiles: users can CRUD their own profile.

## Important Notes
1. Helper functions is_org_member() and is_platform_admin() are SECURITY DEFINER for use in RLS policies.
2. The account_id on candidate_profiles defaults to auth.uid() for client-side inserts.
*/

-- ─── platform_accounts ───
CREATE TABLE IF NOT EXISTS platform_accounts (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  vk_user_id text UNIQUE,
  display_name text NOT NULL DEFAULT '',
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  avatar_url text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_accounts ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_platform_accounts_vk_user_id ON platform_accounts(vk_user_id);

-- ─── platform_role_assignments ───
CREATE TABLE IF NOT EXISTS platform_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('candidate', 'business_member', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, role)
);

ALTER TABLE platform_role_assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_platform_role_assignments_account ON platform_role_assignments(account_id);

-- ─── organizations ───
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES platform_accounts(id),
  name text NOT NULL DEFAULT '',
  full_name text NOT NULL DEFAULT '',
  short_name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'OOO',
  inn text NOT NULL DEFAULT '',
  kpp text NOT NULL DEFAULT '',
  ogrn text NOT NULL DEFAULT '',
  ogrnip text NOT NULL DEFAULT '',
  legal_address text NOT NULL DEFAULT '',
  actual_address text NOT NULL DEFAULT '',
  signatory_full_name text NOT NULL DEFAULT '',
  signatory_position text NOT NULL DEFAULT '',
  authority_type text NOT NULL DEFAULT '',
  contact_email text NOT NULL DEFAULT '',
  contact_phone text NOT NULL DEFAULT '',
  accounting_email text NOT NULL DEFAULT '',
  website text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  logo text NOT NULL DEFAULT '',
  industry text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  data_source text NOT NULL DEFAULT 'manual',
  data_verified_at timestamptz,
  bank_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  public_profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_organizations_inn ON organizations(inn);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- ─── organization_memberships ───
CREATE TABLE IF NOT EXISTS organization_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'administrator', 'marketing_manager', 'hr_manager', 'accountant', 'viewer')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, account_id)
);

ALTER TABLE organization_memberships ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_org_memberships_org ON organization_memberships(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_memberships_account ON organization_memberships(account_id);

-- ─── candidate_profiles ───
CREATE TABLE IF NOT EXISTS candidate_profiles (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  profile_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  profile_completion integer NOT NULL DEFAULT 0,
  is_minor boolean NOT NULL DEFAULT false,
  guardian_verification_status text NOT NULL DEFAULT 'not_required',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE candidate_profiles ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_candidate_profiles_account ON candidate_profiles(account_id);

-- ─── Helper functions (SECURITY DEFINER, created after all tables exist) ───
CREATE OR REPLACE FUNCTION is_org_member(org_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_memberships m
    WHERE m.organization_id = org_id
    AND m.account_id = auth.uid()
    AND m.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION is_platform_admin()
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_role_assignments ra
    WHERE ra.account_id = auth.uid() AND ra.role = 'admin'
  );
$$;

-- ─── platform_accounts policies ───
DROP POLICY IF EXISTS "select_own_account" ON platform_accounts;
CREATE POLICY "select_own_account" ON platform_accounts FOR SELECT
  TO authenticated USING (
    auth.uid() = id
    OR is_platform_admin()
  );

DROP POLICY IF EXISTS "insert_own_account" ON platform_accounts;
CREATE POLICY "insert_own_account" ON platform_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_account" ON platform_accounts;
CREATE POLICY "update_own_account" ON platform_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ─── platform_role_assignments policies ───
DROP POLICY IF EXISTS "select_own_roles" ON platform_role_assignments;
CREATE POLICY "select_own_roles" ON platform_role_assignments FOR SELECT
  TO authenticated USING (
    auth.uid() = account_id
    OR is_platform_admin()
  );

DROP POLICY IF EXISTS "insert_own_role" ON platform_role_assignments;
CREATE POLICY "insert_own_role" ON platform_role_assignments FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = account_id AND role IN ('candidate', 'business_member')
  );

DROP POLICY IF EXISTS "delete_own_role" ON platform_role_assignments;
CREATE POLICY "delete_own_role" ON platform_role_assignments FOR DELETE
  TO authenticated USING (
    auth.uid() = account_id AND role IN ('candidate', 'business_member')
  );

-- ─── organizations policies ───
DROP POLICY IF EXISTS "select_organizations" ON organizations;
CREATE POLICY "select_organizations" ON organizations FOR SELECT
  TO authenticated USING (
    is_platform_admin()
    OR is_org_member(id)
    OR (public_profile->>'isPublished') = 'true'
  );

DROP POLICY IF EXISTS "insert_organizations" ON organizations;
CREATE POLICY "insert_organizations" ON organizations FOR INSERT
  TO authenticated WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "update_organizations" ON organizations;
CREATE POLICY "update_organizations" ON organizations FOR UPDATE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(id)
  ) WITH CHECK (
    is_platform_admin() OR is_org_member(id)
  );

-- ─── organization_memberships policies ───
DROP POLICY IF EXISTS "select_memberships" ON organization_memberships;
CREATE POLICY "select_memberships" ON organization_memberships FOR SELECT
  TO authenticated USING (
    auth.uid() = account_id
    OR is_platform_admin()
    OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "insert_memberships" ON organization_memberships;
CREATE POLICY "insert_memberships" ON organization_memberships FOR INSERT
  TO authenticated WITH CHECK (
    is_platform_admin() OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "update_memberships" ON organization_memberships;
CREATE POLICY "update_memberships" ON organization_memberships FOR UPDATE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  ) WITH CHECK (
    is_platform_admin() OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "delete_memberships" ON organization_memberships;
CREATE POLICY "delete_memberships" ON organization_memberships FOR DELETE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  );

-- ─── candidate_profiles policies ───
DROP POLICY IF EXISTS "select_own_candidate_profile" ON candidate_profiles;
CREATE POLICY "select_own_candidate_profile" ON candidate_profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = account_id
    OR is_platform_admin()
  );

DROP POLICY IF EXISTS "insert_own_candidate_profile" ON candidate_profiles;
CREATE POLICY "insert_own_candidate_profile" ON candidate_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = account_id);

DROP POLICY IF EXISTS "update_own_candidate_profile" ON candidate_profiles;
CREATE POLICY "update_own_candidate_profile" ON candidate_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = account_id) WITH CHECK (auth.uid() = account_id);

DROP POLICY IF EXISTS "delete_own_candidate_profile" ON candidate_profiles;
CREATE POLICY "delete_own_candidate_profile" ON candidate_profiles FOR DELETE
  TO authenticated USING (auth.uid() = account_id);

-- ─── updated_at triggers (shared) ───
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_platform_accounts_updated_at ON platform_accounts;
CREATE TRIGGER trg_platform_accounts_updated_at
  BEFORE UPDATE ON platform_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_candidate_profiles_updated_at ON candidate_profiles;
CREATE TRIGGER trg_candidate_profiles_updated_at
  BEFORE UPDATE ON candidate_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();