import { query } from "@/lib/db";

export type LeadStatus = "pending" | "verified";

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  status: LeadStatus;
  created_at: string;
  verified_at: string | null;
};

/**
 * Written when the form is submitted, before verification, so the admin panel
 * shows drop-offs as well as completions.
 */
export async function createLead(input: {
  name: string;
  email: string;
  phone: string;
  country: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<string | null> {
  const rows = await query<{ id: string }>(
    `INSERT INTO leads (name, email, phone, country, ip, user_agent)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [input.name, input.email, input.phone, input.country, input.ip ?? null, input.userAgent ?? null],
  );
  return rows?.[0]?.id ?? null;
}

export async function markLeadVerified(id: string) {
  await query(
    `UPDATE leads SET status = 'verified', verified_at = NOW() WHERE id = $1 AND status <> 'verified'`,
    [id],
  );
}

/** Best-effort abuse guard: this endpoint sends outbound email on demand. */
export async function recentSendCount(email: string, minutes = 15): Promise<number | null> {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM leads
     WHERE email = $1 AND created_at > NOW() - ($2 || ' minutes')::interval`,
    [email, String(minutes)],
  );
  if (!rows) return null;
  return Number(rows[0]?.count ?? 0);
}

export async function listLeads(limit = 500): Promise<Lead[] | null> {
  return query<Lead>(
    `SELECT id::text, name, email, phone, country, status,
            created_at::text, verified_at::text
     FROM leads ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
}
