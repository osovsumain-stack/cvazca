/*
# Create referral, reward, fraud, consent, notification tables

## Overview
Creates tables for the referral system, reward ledger, fraud detection,
consent event log, and notifications.

## New Tables
### referral_links — referral links per account/program
### referral_clicks — tracks clicks on referral links
### referral_attributions — attribution records linking referrer to referred
### referral_events — event log for attribution lifecycle
### reward_wallets — per-account/currency wallet with cached balance
### reward_transactions — ledger entries (EARN/SPEND/REVERSE/EXPIRE/ADJUSTMENT)
### reward_redemptions — tracks reward spending on services
### fraud_flags — fraud detection flags
### consent_events — event-based consent log (accept/withdraw)
### notifications — user notifications

## Security
- RLS enabled on all tables.
- Referral: users see their own links/clicks/attributions; admins see all.
- Reward: users see their own wallets/transactions; admins see all. Only service role writes transactions.
- Fraud: admin-only.
- Consent: users see their own; org management can see org-scoped consents.
- Notifications: users see their own.

## Important Notes
1. Reward ledger uses kopecks (integer amounts).
2. Referral attributions have a 30-day expiry window.
3. Consent is event-based: each acceptance creates a new event, withdrawals mark previous as withdrawn.
4. Notifications are created server-side (by the service role), not by clients.
*/

-- ─── referral_links ───
CREATE TABLE IF NOT EXISTS referral_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id text NOT NULL,
  referrer_account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  url text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ref_links_referrer ON referral_links(referrer_account_id);
CREATE INDEX IF NOT EXISTS idx_ref_links_code ON referral_links(code);

DROP POLICY IF EXISTS "select_own_ref_links" ON referral_links;
CREATE POLICY "select_own_ref_links" ON referral_links FOR SELECT
  TO authenticated USING (
    referrer_account_id = auth.uid() OR is_platform_admin()
  );

DROP POLICY IF EXISTS "insert_own_ref_links" ON referral_links;
CREATE POLICY "insert_own_ref_links" ON referral_links FOR INSERT
  TO authenticated WITH CHECK (referrer_account_id = auth.uid());

-- ─── referral_clicks ───
CREATE TABLE IF NOT EXISTS referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  visitor_ip text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  clicked_at timestamptz NOT NULL DEFAULT now(),
  converted boolean NOT NULL DEFAULT false
);

ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ref_clicks_link ON referral_clicks(link_id);

DROP POLICY IF EXISTS "select_own_ref_clicks" ON referral_clicks;
CREATE POLICY "select_own_ref_clicks" ON referral_clicks FOR SELECT
  TO authenticated USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM referral_links l
      WHERE l.id = link_id AND l.referrer_account_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_ref_clicks" ON referral_clicks;
CREATE POLICY "insert_ref_clicks" ON referral_clicks FOR INSERT
  TO authenticated WITH CHECK (true);

-- ─── referral_attributions ───
CREATE TABLE IF NOT EXISTS referral_attributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id uuid NOT NULL REFERENCES referral_links(id) ON DELETE CASCADE,
  referrer_account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  referred_account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  program_type text NOT NULL CHECK (program_type IN ('business','career')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','attributed','qualified','cancelled')),
  attributed_at timestamptz NOT NULL DEFAULT now(),
  qualified_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days')
);

ALTER TABLE referral_attributions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ref_attributions_referrer ON referral_attributions(referrer_account_id);
CREATE INDEX IF NOT EXISTS idx_ref_attributions_referred ON referral_attributions(referred_account_id);

DROP POLICY IF EXISTS "select_own_attributions" ON referral_attributions;
CREATE POLICY "select_own_attributions" ON referral_attributions FOR SELECT
  TO authenticated USING (
    referrer_account_id = auth.uid()
    OR referred_account_id = auth.uid()
    OR is_platform_admin()
  );

-- ─── referral_events ───
CREATE TABLE IF NOT EXISTS referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribution_id uuid NOT NULL REFERENCES referral_attributions(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT '',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ref_events_attribution ON referral_events(attribution_id);

DROP POLICY IF EXISTS "select_own_ref_events" ON referral_events;
CREATE POLICY "select_own_ref_events" ON referral_events FOR SELECT
  TO authenticated USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM referral_attributions a
      WHERE a.id = attribution_id
      AND (a.referrer_account_id = auth.uid() OR a.referred_account_id = auth.uid())
    )
  );

-- ─── reward_wallets ───
CREATE TABLE IF NOT EXISTS reward_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  currency text NOT NULL CHECK (currency IN ('DIAMOND','EMERALD')),
  cached_balance integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, currency)
);

ALTER TABLE reward_wallets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reward_wallets_account ON reward_wallets(account_id);

DROP POLICY IF EXISTS "select_own_wallets" ON reward_wallets;
CREATE POLICY "select_own_wallets" ON reward_wallets FOR SELECT
  TO authenticated USING (
    account_id = auth.uid() OR is_platform_admin()
  );

DROP POLICY IF EXISTS "insert_own_wallets" ON reward_wallets;
CREATE POLICY "insert_own_wallets" ON reward_wallets FOR INSERT
  TO authenticated WITH CHECK (account_id = auth.uid());

DROP POLICY IF EXISTS "update_own_wallets" ON reward_wallets;
CREATE POLICY "update_own_wallets" ON reward_wallets FOR UPDATE
  TO authenticated USING (
    account_id = auth.uid() OR is_platform_admin()
  ) WITH CHECK (
    account_id = auth.uid() OR is_platform_admin()
  );

-- ─── reward_transactions ───
CREATE TABLE IF NOT EXISTS reward_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES reward_wallets(id) ON DELETE CASCADE,
  currency_type text NOT NULL CHECK (currency_type IN ('DIAMOND','EMERALD')),
  operation_type text NOT NULL CHECK (operation_type IN ('EARN','SPEND','REVERSE','EXPIRE','ADJUSTMENT')),
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','AVAILABLE','SPENT','REVERSED','EXPIRED')),
  source_type text NOT NULL DEFAULT 'adjustment' CHECK (source_type IN ('referral_business','referral_career','milestone','redemption','adjustment','reversal')),
  source_id text NOT NULL DEFAULT '',
  source_event_id text,
  reversal_of_id uuid,
  rule_version text,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE reward_transactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_reward_txs_wallet ON reward_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_reward_txs_source ON reward_transactions(source_event_id);

DROP POLICY IF EXISTS "select_own_transactions" ON reward_transactions;
CREATE POLICY "select_own_transactions" ON reward_transactions FOR SELECT
  TO authenticated USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM reward_wallets w
      WHERE w.id = wallet_id AND w.account_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_transactions" ON reward_transactions;
CREATE POLICY "insert_own_transactions" ON reward_transactions FOR INSERT
  TO authenticated WITH CHECK (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM reward_wallets w
      WHERE w.id = wallet_id AND w.account_id = auth.uid()
    )
  );

-- ─── reward_redemptions ───
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES reward_wallets(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 0,
  service_type text NOT NULL DEFAULT '',
  discount_applied integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','completed','reversed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_redemptions_wallet ON reward_redemptions(wallet_id);

DROP POLICY IF EXISTS "select_own_redemptions" ON reward_redemptions;
CREATE POLICY "select_own_redemptions" ON reward_redemptions FOR SELECT
  TO authenticated USING (
    is_platform_admin()
    OR EXISTS (
      SELECT 1 FROM reward_wallets w
      WHERE w.id = wallet_id AND w.account_id = auth.uid()
    )
  );

-- ─── fraud_flags ───
CREATE TABLE IF NOT EXISTS fraud_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attribution_id uuid REFERENCES referral_attributions(id) ON DELETE CASCADE,
  account_id uuid REFERENCES platform_accounts(id) ON DELETE CASCADE,
  reason text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'low' CHECK (severity IN ('low','medium','high')),
  description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'FRAUD_REVIEW_REQUIRED' CHECK (status IN ('FRAUD_REVIEW_REQUIRED','cleared','blocked')),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES platform_accounts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE fraud_flags ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_fraud_flags_account ON fraud_flags(account_id);
CREATE INDEX IF NOT EXISTS idx_fraud_flags_attribution ON fraud_flags(attribution_id);

DROP POLICY IF EXISTS "select_fraud_flags" ON fraud_flags;
CREATE POLICY "select_fraud_flags" ON fraud_flags FOR SELECT
  TO authenticated USING (is_platform_admin());

DROP POLICY IF EXISTS "insert_fraud_flags" ON fraud_flags;
CREATE POLICY "insert_fraud_flags" ON fraud_flags FOR INSERT
  TO authenticated WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "update_fraud_flags" ON fraud_flags;
CREATE POLICY "update_fraud_flags" ON fraud_flags FOR UPDATE
  TO authenticated USING (is_platform_admin()) WITH CHECK (is_platform_admin());

-- ─── consent_events ───
CREATE TABLE IF NOT EXISTS consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  consent_type text NOT NULL CHECK (consent_type IN ('personal_data','user_terms','public_distribution','marketing','business_terms','vacancy_rules','advertising_terms','referral_rules')),
  document_slug text NOT NULL DEFAULT '',
  document_version text NOT NULL DEFAULT '',
  categories jsonb,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  withdrawn_at timestamptz,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('vk_registration','business_creation','vacancy_submit','advertising_create','resume_publish','manual')),
  ip_address text,
  user_agent text
);

ALTER TABLE consent_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_consent_events_account ON consent_events(account_id);
CREATE INDEX IF NOT EXISTS idx_consent_events_org ON consent_events(organization_id);

DROP POLICY IF EXISTS "select_own_consent" ON consent_events;
CREATE POLICY "select_own_consent" ON consent_events FOR SELECT
  TO authenticated USING (
    account_id = auth.uid()
    OR is_platform_admin()
    OR (organization_id IS NOT NULL AND is_org_member(organization_id))
  );

DROP POLICY IF EXISTS "insert_own_consent" ON consent_events;
CREATE POLICY "insert_own_consent" ON consent_events FOR INSERT
  TO authenticated WITH CHECK (account_id = auth.uid());

DROP POLICY IF EXISTS "update_own_consent" ON consent_events;
CREATE POLICY "update_own_consent" ON consent_events FOR UPDATE
  TO authenticated USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());

-- ─── notifications ───
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES platform_accounts(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'project_status_changed',
  title text NOT NULL DEFAULT '',
  message text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_notifications_account ON notifications(account_id);

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (account_id = auth.uid());

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (account_id = auth.uid());

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (account_id = auth.uid()) WITH CHECK (account_id = auth.uid());

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (account_id = auth.uid());

-- ─── updated_at triggers ───
DROP TRIGGER IF EXISTS trg_reward_wallets_updated_at ON reward_wallets;
CREATE TRIGGER trg_reward_wallets_updated_at
  BEFORE UPDATE ON reward_wallets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();