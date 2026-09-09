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
  ip: string | null;
  user_agent: string | null;
};

export type LeadStats = {
  total: number;
  verified: number;
  pending: number;
  today: number;
  last7: number;
  last30: number;
  conversion: number; // percent, 0-100
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

/** Best-effort abuse guard: the send endpoint triggers outbound email. */
export async function recentSendCount(email: string, minutes = 15): Promise<number | null> {
  const rows = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM leads
     WHERE email = $1 AND created_at > NOW() - ($2 || ' minutes')::interval`,
    [email, String(minutes)],
  );
  if (!rows) return null;
  return Number(rows[0]?.count ?? 0);
}

/* ---------------------------------------------------------------- querying */

// Whitelisted so a sort parameter can never be injected into the SQL.
const SORTABLE = {
  created_at: "created_at",
  name: "name",
  email: "email",
  country: "country",
  status: "status",
} as const;

export type SortKey = keyof typeof SORTABLE;

export type LeadQuery = {
  search?: string;
  status?: LeadStatus | "all";
  days?: number | null; // null = all time
  sort?: SortKey;
  dir?: "asc" | "desc";
  page?: number;
  perPage?: number;
};

export async function listLeads(opts: LeadQuery = {}): Promise<{ rows: Lead[]; total: number } | null> {
  const {
    search = "",
    status = "all",
    days = null,
    sort = "created_at",
    dir = "desc",
    page = 1,
    perPage = 25,
  } = opts;

  const where: string[] = [];
  const params: unknown[] = [];

  if (search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    where.push(
      `(LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length}
        OR LOWER(phone) LIKE $${params.length} OR LOWER(country) LIKE $${params.length})`,
    );
  }
  if (status === "pending" || status === "verified") {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (days && Number.isFinite(days)) {
    params.push(String(days));
    where.push(`created_at > NOW() - ($${params.length} || ' days')::interval`);
  }

  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const column = SORTABLE[sort] ?? "created_at";
  const direction = dir === "asc" ? "ASC" : "DESC";
  const offset = Math.max(0, (page - 1) * perPage);

  const counted = await query<{ count: string }>(`SELECT COUNT(*)::text AS count FROM leads ${clause}`, params);
  if (counted === null) return null;

  const rows = await query<Lead>(
    `SELECT id::text, name, email, phone, country, status,
            created_at::text, verified_at::text, ip, user_agent
     FROM leads ${clause}
     ORDER BY ${column} ${direction} NULLS LAST, id DESC
     LIMIT ${Number(perPage)} OFFSET ${Number(offset)}`,
    params,
  );

  return { rows: rows ?? [], total: Number(counted[0]?.count ?? 0) };
}

export async function leadStats(): Promise<LeadStats | null> {
  const rows = await query<Record<string, string>>(
    `SELECT
       COUNT(*)::text                                                             AS total,
       COUNT(*) FILTER (WHERE status = 'verified')::text                          AS verified,
       COUNT(*) FILTER (WHERE created_at::date = NOW()::date)::text               AS today,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::text       AS last7,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::text      AS last30
     FROM leads`,
  );
  if (!rows) return null;

  const r = rows[0] ?? {};
  const total = Number(r.total ?? 0);
  const verified = Number(r.verified ?? 0);
  return {
    total,
    verified,
    pending: total - verified,
    today: Number(r.today ?? 0),
    last7: Number(r.last7 ?? 0),
    last30: Number(r.last30 ?? 0),
    conversion: total ? Math.round((verified / total) * 100) : 0,
  };
}
