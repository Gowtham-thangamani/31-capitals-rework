/**
 * Verifies the leads database is reachable and correctly set up.
 *
 *   npm run db:check
 *
 * Reads DATABASE_URL from .env.local (or the real environment) and reports the
 * connection, the schema, and how many leads are stored.
 */
import { readFileSync, existsSync } from "node:fs";
import pg from "pg";

// Minimal .env loader so this runs without adding a dotenv dependency.
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!process.env[m[1]] && value) process.env[m[1]] = value;
  }
}

const url = process.env.DATABASE_URL;

if (!url) {
  console.error(`
DATABASE_URL is not set.

  1. Create a free project at https://supabase.com
  2. Project Settings -> Database -> Connection string -> "Transaction pooler"
  3. Put it in .env.local as:

     DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres

  Use the *pooler* string (port 6543), not the direct one (5432) — serverless
  hosts open many short-lived connections and will exhaust a direct connection.
`);
  process.exit(1);
}

// Never print the password.
const redacted = url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
console.log(`Connecting to ${redacted}\n`);

const client = new pg.Client({
  connectionString: url,
  ssl: process.env.DATABASE_SSL === "disable" ? undefined : { rejectUnauthorized: false },
  connectionTimeoutMillis: 15_000,
});

try {
  await client.connect();
  const { rows: [info] } = await client.query("SELECT current_database() AS db, version() AS version");
  console.log(`connected      database "${info.db}"`);
  console.log(`               ${info.version.split(",")[0]}`);

  await client.query(`
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
  `);
  console.log(`schema         "leads" table ready`);

  const { rows: [count] } = await client.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'verified')::int AS verified
     FROM leads`,
  );
  console.log(`rows           ${count.total} total, ${count.verified} verified`);

  const missing = ["ADMIN_PASSWORD", "RESEND_API_KEY", "VERIFY_SECRET"].filter((k) => !process.env[k]);
  console.log(`\nAll good — the form will now record leads and /admin will list them.`);
  if (missing.length) {
    console.log(`\nStill unset (optional but recommended): ${missing.join(", ")}`);
    if (missing.includes("ADMIN_PASSWORD")) console.log(`  ADMIN_PASSWORD  -> without it, /admin stays closed`);
    if (missing.includes("RESEND_API_KEY")) console.log(`  RESEND_API_KEY  -> without it, the OTP is shown on screen instead of emailed`);
    if (missing.includes("VERIFY_SECRET")) console.log(`  VERIFY_SECRET   -> without it, a default dev secret signs the cookies`);
  }
} catch (err) {
  console.error(`\nFAILED: ${err.message}`);
  if (/password authentication|SASL|SCRAM/i.test(err.message)) {
    console.error(`  -> Wrong password. Reset it in Supabase: Project Settings -> Database.`);
  } else if (/ENOTFOUND|EAI_AGAIN/i.test(err.message)) {
    console.error(`  -> Host not found. Check the hostname in the connection string.`);
  } else if (/timeout|ETIMEDOUT/i.test(err.message)) {
    console.error(`  -> Timed out. Check the port (use 6543 for the pooler) and any firewall.`);
  } else if (/self.signed|certificate/i.test(err.message)) {
    console.error(`  -> TLS issue. For a local Postgres without TLS set DATABASE_SSL=disable.`);
  }
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
