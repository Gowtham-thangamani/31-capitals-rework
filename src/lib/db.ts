import { Pool } from "pg";

/**
 * Postgres access. The app must keep working when DATABASE_URL is absent (local
 * dev, preview builds), so every helper degrades to a no-op rather than throwing.
 */

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!isDbConfigured()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3, // serverless-friendly: hosts run many instances
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      ssl: process.env.DATABASE_SSL === "disable" ? undefined : { rejectUnauthorized: false },
    });
  }
  return pool;
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS leads (
    id           BIGSERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL,
    phone        TEXT NOT NULL,
    country      TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at  TIMESTAMPTZ,
    ip           TEXT,
    user_agent   TEXT
  );
  CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
  CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (email);

  -- Failed admin logins, so the panel password cannot be brute forced. Stored in
  -- the database rather than in memory because serverless runs many instances and
  -- an in-process counter would reset on every cold start.
  CREATE TABLE IF NOT EXISTS admin_login_attempts (
    id           BIGSERIAL PRIMARY KEY,
    ip           TEXT NOT NULL,
    attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS admin_login_attempts_idx ON admin_login_attempts (ip, attempted_at DESC);
`;

/** Applied once per process, on first use. */
function ensureSchema(p: Pool) {
  if (!schemaReady) {
    schemaReady = p.query(SCHEMA).then(
      () => undefined,
      (err) => {
        schemaReady = null; // let a later request retry
        throw err;
      },
    );
  }
  return schemaReady;
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[] | null> {
  const p = getPool();
  if (!p) return null;
  await ensureSchema(p);
  const res = await p.query(text, params);
  return res.rows as T[];
}
