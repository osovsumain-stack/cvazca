/*
# Create guardian, partner, invitation, admin grant tables

## Overview
Creates tables for guardian verification (minors 14-17), partners,
organization invitations, and admin grants.

## New Tables
### guardian_verifications — parental consent for minors
### partners — platform partners (marquee display)
### organization_invitations — invite users to organizations
### admin_grants — admin role grants (managed by admins)

## Security
- RLS enabled on all tables.
- Guardian: users see their own; token-based access for guardians (via service role).
- Partners: public read (active partners visible to all authenticated).
- Invitations: org management can see; token-based access for invitees.
- Admin grants: admin-only.

## Important Notes
1. Guardian verification uses one-time tokens with 7-day expiry.
2. Partners have a sort_order for display ordering.
3. Invitations use one-time tokens with 7-day expiry.
*/

-- ─── guardian_verifications ───
CREATE TABLE IF NOT EXISTS guardian_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  guardian_name text NOT NULL DEFAULT '',
  guardian_relation text NOT NULL DEFAULT '',
  guardian_email text NOT NULL DEFAULT '',
  guardian_phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('not_required','required','pending','verified','rejected')),
  verification_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  consent_version text,
  verification_method text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  verified_at timestamptz
);

ALTER TABLE guardian_verifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_guardian_candidate ON guardian_verifications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_guardian_token ON guardian_verifications(verification_token);

DROP POLICY IF EXISTS "select_own_guardian" ON guardian_verifications;
CREATE POLICY "select_own_guardian" ON guardian_verifications FOR SELECT
  TO authenticated USING (
    candidate_id = auth.uid() OR is_platform_admin()
  );

DROP POLICY IF EXISTS "insert_own_guardian" ON guardian_verifications;
CREATE POLICY "insert_own_guardian" ON guardian_verifications FOR INSERT
  TO authenticated WITH CHECK (candidate_id = auth.uid());

DROP POLICY IF EXISTS "update_own_guardian" ON guardian_verifications;
CREATE POLICY "update_own_guardian" ON guardian_verifications FOR UPDATE
  TO authenticated USING (
    candidate_id = auth.uid() OR is_platform_admin()
  ) WITH CHECK (
    candidate_id = auth.uid() OR is_platform_admin()
  );

-- ─── partners ───
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  logo_url text,
  website_url text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'platform' CHECK (type IN ('platform','advertising','career','media','education','other')),
  description text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_partners_active ON partners(is_active, sort_order);

DROP POLICY IF EXISTS "select_partners" ON partners;
CREATE POLICY "select_partners" ON partners FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_partners" ON partners;
CREATE POLICY "insert_partners" ON partners FOR INSERT
  TO authenticated WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "update_partners" ON partners;
CREATE POLICY "update_partners" ON partners FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "delete_partners" ON partners;
CREATE POLICY "delete_partners" ON partners FOR DELETE
  TO authenticated USING (is_platform_admin());

-- ─── organization_invitations ───
CREATE TABLE IF NOT EXISTS organization_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  invitee_name text NOT NULL DEFAULT '',
  invitee_vk_url text NOT NULL DEFAULT '',
  invitee_email text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'viewer' CHECK (role IN ('administrator','marketing_manager','hr_manager','accountant','viewer')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','cancelled')),
  invite_token text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days')
);

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_invitations_org ON organization_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON organization_invitations(invite_token);

DROP POLICY IF EXISTS "select_invitations" ON organization_invitations;
CREATE POLICY "select_invitations" ON organization_invitations FOR SELECT
  TO authenticated USING (
    invited_by = auth.uid()
    OR is_platform_admin()
    OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "insert_invitations" ON organization_invitations;
CREATE POLICY "insert_invitations" ON organization_invitations FOR INSERT
  TO authenticated WITH CHECK (
    is_platform_admin() OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "update_invitations" ON organization_invitations;
CREATE POLICY "update_invitations" ON organization_invitations FOR UPDATE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  ) WITH CHECK (
    is_platform_admin() OR is_org_member(organization_id)
  );

DROP POLICY IF EXISTS "delete_invitations" ON organization_invitations;
CREATE POLICY "delete_invitations" ON organization_invitations FOR DELETE
  TO authenticated USING (
    is_platform_admin() OR is_org_member(organization_id)
  );

-- ─── admin_grants ───
CREATE TABLE IF NOT EXISTS admin_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vk_user_id text NOT NULL DEFAULT '',
  display_name text NOT NULL DEFAULT '',
  is_primary boolean NOT NULL DEFAULT false,
  granted_at timestamptz NOT NULL DEFAULT now(),
  granted_by uuid REFERENCES platform_accounts(id)
);

ALTER TABLE admin_grants ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_admin_grants_vk ON admin_grants(vk_user_id);

DROP POLICY IF EXISTS "select_admin_grants" ON admin_grants;
CREATE POLICY "select_admin_grants" ON admin_grants FOR SELECT
  TO authenticated USING (is_platform_admin());

DROP POLICY IF EXISTS "insert_admin_grants" ON admin_grants;
CREATE POLICY "insert_admin_grants" ON admin_grants FOR INSERT
  TO authenticated WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "update_admin_grants" ON admin_grants;
CREATE POLICY "update_admin_grants" ON admin_grants FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "delete_admin_grants" ON admin_grants;
CREATE POLICY "delete_admin_grants" ON admin_grants FOR DELETE
  TO authenticated USING (is_platform_admin());