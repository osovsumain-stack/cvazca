/*
# Fix security advisor findings: function search_path and EXECUTE grants

## Overview
Fixes security advisor warnings without dropping functions (which policies depend on).

## Changes
1. ALTER FUNCTION to set explicit search_path on helper functions.
2. Revoke EXECUTE from anon on helper functions to prevent direct RPC calls.
3. ALTER the trigger function to set search_path.

## Security
- Functions are now safe from search_path manipulation.
- Functions cannot be called directly via REST API by anon users.
- RLS policies continue to work — they call the functions internally.
*/

-- Fix search_path on SECURITY DEFINER functions
ALTER FUNCTION is_org_member(uuid) SET search_path = 'public';
ALTER FUNCTION is_platform_admin() SET search_path = 'public';

-- Fix search_path on trigger function
ALTER FUNCTION update_updated_at_column() SET search_path = 'public';

-- Revoke EXECUTE from anon on helper functions (prevents direct RPC calls)
REVOKE EXECUTE ON FUNCTION is_org_member(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION is_platform_admin() FROM anon;