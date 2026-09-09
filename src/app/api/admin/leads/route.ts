import { NextRequest, NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { leadStats, listLeads, type LeadStatus, type SortKey } from "@/lib/leads";
import { ADMIN_COOKIE_NAME, isAdminSessionValid } from "@/lib/verification";

export const dynamic = "force-dynamic";

const SORT_KEYS: SortKey[] = ["created_at", "name", "email", "country", "status"];

export async function GET(req: NextRequest) {
  // Lead data is personal information: never serve it without a valid session.
  if (!isAdminSessionValid(req.cookies.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Not authorised." }, { status: 401 });
  }
  if (!isDbConfigured()) {
    return NextResponse.json({ error: "Database not connected." }, { status: 503 });
  }

  const p = req.nextUrl.searchParams;
  const sortParam = p.get("sort") as SortKey | null;
  const statusParam = p.get("status");
  const daysParam = Number(p.get("days"));

  try {
    const [result, stats] = await Promise.all([
      listLeads({
        search: p.get("q") ?? "",
        status: statusParam === "pending" || statusParam === "verified" ? (statusParam as LeadStatus) : "all",
        days: Number.isFinite(daysParam) && daysParam > 0 ? daysParam : null,
        sort: sortParam && SORT_KEYS.includes(sortParam) ? sortParam : "created_at",
        dir: p.get("dir") === "asc" ? "asc" : "desc",
        page: Math.max(1, Number(p.get("page")) || 1),
        perPage: Math.min(100, Math.max(10, Number(p.get("perPage")) || 25)),
      }),
      leadStats(),
    ]);

    return NextResponse.json({
      ok: true,
      rows: result?.rows ?? [],
      total: result?.total ?? 0,
      stats,
      fetchedAt: Date.now(),
    });
  } catch (err) {
    console.error("[admin] lead query failed:", err);
    return NextResponse.json({ error: "Could not read leads." }, { status: 500 });
  }
}
