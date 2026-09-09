import { query } from "@/lib/db";

/**
 * Brute-force protection for the admin password.
 *
 * The panel is guarded by a single shared secret, so unlimited guessing would
 * expose every lead. Attempts are recorded in Postgres rather than in memory
 * because serverless hosts run many short-lived instances and an in-process
 * counter would reset constantly.
 *
 * If the database is unreachable we fall back to an in-memory counter: weaker,
 * but better than no limit at all, and it never locks a legitimate admin out
 * because of an outage.
 */

const MAX_ATTEMPTS = 8;
const WINDOW_MINUTES = 15;

const memory = new Map<string, number[]>();

function memoryAttempts(ip: string) {
  const cutoff = Date.now() - WINDOW_MINUTES * 60_000;
  const hits = (memory.get(ip) ?? []).filter((t) => t > cutoff);
  memory.set(ip, hits);
  return hits.length;
}

export type RateLimitState = { blocked: boolean; remaining: number; retryAfterMinutes: number };

export async function checkLoginAllowed(ip: string): Promise<RateLimitState> {
  let count: number;
  try {
    const rows = await query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM admin_login_attempts
       WHERE ip = $1 AND attempted_at > NOW() - ($2 || ' minutes')::interval`,
      [ip, String(WINDOW_MINUTES)],
    );
    count = rows ? Number(rows[0]?.count ?? 0) : memoryAttempts(ip);
  } catch {
    count = memoryAttempts(ip);
  }

  return {
    blocked: count >= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - count),
    retryAfterMinutes: WINDOW_MINUTES,
  };
}

export async function recordFailedLogin(ip: string) {
  try {
    const result = await query(`INSERT INTO admin_login_attempts (ip) VALUES ($1)`, [ip]);
    if (result !== null) return;
  } catch {
    // fall through to the in-memory counter
  }
  memory.set(ip, [...(memory.get(ip) ?? []), Date.now()]);
}

/** A correct password clears the slate for that address. */
export async function clearLoginAttempts(ip: string) {
  memory.delete(ip);
  try {
    await query(`DELETE FROM admin_login_attempts WHERE ip = $1`, [ip]);
  } catch {
    // nothing to do; the window will expire on its own
  }
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
