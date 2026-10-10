-- ─── dadata_cache ───
-- Internal cache table for DaData API responses.
-- Used by Edge Functions (lookup-organization, lookup-bank) to reduce
-- external API calls. This table is server/internal — anon clients must
-- NOT have direct read/write access.

CREATE TABLE IF NOT EXISTS dadata_cache (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dadata_cache_expires_at
  ON dadata_cache(expires_at);

ALTER TABLE dadata_cache ENABLE ROW LEVEL SECURITY;

-- No policies: anon and authenticated roles get NO access.
-- Only the service role (used by Edge Functions) can read/write.
-- This is intentional — the cache is an internal implementation detail.