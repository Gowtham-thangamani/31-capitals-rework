-- 31 Capitals — leads table
-- Run this in Supabase: SQL Editor -> New query -> paste -> Run.
--
-- Safe to run more than once: every statement is IF NOT EXISTS / idempotent.
-- The app also creates this automatically on first connection (see src/lib/db.ts),
-- so running this by hand is optional — it just lets you see the table immediately.

CREATE TABLE IF NOT EXISTS public.leads (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  phone        TEXT        NOT NULL,
  country      TEXT        NOT NULL,          -- ISO-2 code, e.g. AE
  status       TEXT        NOT NULL DEFAULT 'pending',   -- 'pending' | 'verified'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),       -- when the form was submitted
  verified_at  TIMESTAMPTZ,                              -- when the email code was confirmed
  ip           TEXT,
  user_agent   TEXT
);

-- The admin panel lists newest-first and the rate limiter looks up by email.
CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_email_idx      ON public.leads (email);

-- ---------------------------------------------------------------------------
-- SECURITY — do not skip this.
--
-- Supabase publishes every table in the `public` schema through its auto-generated
-- REST API, reachable with the anon key (which is public by design in client apps).
-- This table holds names, emails and phone numbers. Without RLS, that data would be
-- readable by anyone holding that key.
--
-- Enabling RLS with no policies denies anon/authenticated entirely. The app is
-- unaffected: it connects as the table owner over the Postgres connection string,
-- and owners bypass RLS.
-- ---------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.leads FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- Failed admin logins, so the panel password cannot be brute forced.
-- Stored here rather than in memory because serverless runs many short-lived
-- instances and an in-process counter would reset on every cold start.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_login_attempts (
  id           BIGSERIAL PRIMARY KEY,
  ip           TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_login_attempts_idx
  ON public.admin_login_attempts (ip, attempted_at DESC);

ALTER TABLE public.admin_login_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_login_attempts FROM anon, authenticated;

-- Check it worked: expect rls_enabled = true
SELECT
  relname             AS table_name,
  relrowsecurity      AS rls_enabled,
  (SELECT COUNT(*) FROM public.leads) AS row_count
FROM pg_class
WHERE oid = 'public.leads'::regclass;
