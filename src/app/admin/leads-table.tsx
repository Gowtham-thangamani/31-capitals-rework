"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ThemeToggle, useAdminTheme } from "@/app/admin/theme-toggle";
import type { Lead, LeadStats, SortKey } from "@/lib/leads";

const REFRESH_MS = 30_000;
const PER_PAGE = 25;

const DATE_RANGES = [
  { label: "All time", days: 0 },
  { label: "Today", days: 1 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
];

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "country", label: "Country" },
  { key: "status", label: "Status" },
  { key: "created_at", label: "Submitted" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

/** A supporting figure. Deliberately quiet: only conversion is allowed to shout. */
function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="px-5 py-3.5">
      <p className="font-display text-xl tabular-nums" style={{ color: "var(--a-ink)" }}>{value}</p>
      <p className="mt-0.5 text-xs" style={{ color: "var(--a-faint)" }}>{label}</p>
    </div>
  );
}

function CopyButton({ text, title }: { text: string; title: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title={title}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1200);
        } catch {
          /* clipboard unavailable (insecure context) — ignore */
        }
      }}
      className="ml-1.5 rounded px-1 text-[10px] transition"
      style={{ color: "var(--a-faint)" }}
    >
      {done ? "✓" : "copy"}
    </button>
  );
}

export function LeadsTable() {
  const { theme, setTheme } = useAdminTheme();
  const [rows, setRows] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "pending" | "verified">("all");
  const [days, setDays] = useState(0);
  const [sort, setSort] = useState<SortKey>("created_at");
  const [dir, setDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Ids seen on the previous poll, so genuinely new arrivals can be highlighted.
  const seen = useRef<Set<string> | null>(null);
  const [fresh, setFresh] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const params = new URLSearchParams({
      q,
      status,
      sort,
      dir,
      page: String(page),
      perPage: String(PER_PAGE),
      ...(days ? { days: String(days) } : {}),
    });
    try {
      const res = await fetch(`/api/admin/leads?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load leads.");

      const incoming: Lead[] = data.rows ?? [];
      if (seen.current) {
        const added = incoming.filter((r) => !seen.current!.has(r.id)).map((r) => r.id);
        if (added.length) {
          setFresh(new Set(added));
          setTimeout(() => setFresh(new Set()), 4000);
        }
      }
      seen.current = new Set(incoming.map((r) => r.id));

      setRows(incoming);
      setTotal(data.total ?? 0);
      setStats(data.stats ?? null);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load leads.");
    } finally {
      setLoading(false);
    }
  }, [q, status, days, sort, dir, page]);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (!cancelled) await load();
    };
    void tick();
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void tick();
    }, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [load]);

  // Changing a filter returns to page 1, otherwise you can land on an empty page.
  // Done in the handlers rather than an effect, which would cascade renders.
  const applyFilter = (change: () => void) => {
    change();
    setPage(1);
  };

  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  const toggleSort = (key: SortKey) => {
    if (sort === key) setDir(dir === "asc" ? "desc" : "asc");
    else {
      setSort(key);
      setDir(key === "created_at" ? "desc" : "asc");
    }
  };

  const csv = useMemo(() => {
    const esc = (v: string) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    const head = ["Name", "Email", "Phone", "Country", "Status", "Submitted", "Verified"];
    return [
      head.map(esc).join(","),
      ...rows.map((r) =>
        [r.name, r.email, r.phone, r.country, r.status, r.created_at ?? "", r.verified_at ?? ""].map(esc).join(","),
      ),
    ].join("\n");
  }, [rows]);

  function downloadCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `31capitals-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    window.location.reload();
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6"
        style={{ borderBottom: "1px solid var(--a-border)" }}>
        <div className="flex items-center gap-5">
          <Logo markClassName="h-8 w-auto" wordmarkClassName="h-5 w-auto" priority onLight={theme === "light"} />
          <span className="hidden h-7 w-px sm:block" style={{ background: "var(--a-border-strong)" }} />
          <div className="hidden sm:block">
            <p className="font-display text-lg" style={{ color: "var(--a-ink)" }}>Leads</p>
            <p className="text-xs" style={{ color: "var(--a-faint)" }}>
              {loading ? "Refreshing…" : "Updates every 30 seconds"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ThemeToggle theme={theme} onChange={setTheme} />
          <button
            onClick={downloadCsv}
            className="h-10 rounded-lg px-4 text-sm transition"
            style={{ border: "1px solid var(--a-border-strong)", background: "var(--a-accent-soft)", color: "var(--a-accent)" }}
          >
            Export CSV
          </button>
          <button
            onClick={signOut}
            className="h-10 rounded-lg px-4 text-sm transition"
            style={{ border: "1px solid var(--a-border)", color: "var(--a-muted)" }}
          >
            Sign out
          </button>
        </div>
      </div>

      {stats ? (
        <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-stretch">
          {/* The figure the desk acts on, given the weight to match */}
          <div className="a-panel flex items-center gap-6 rounded-2xl px-7 py-6">
            <div>
              <p className="font-display text-6xl leading-none tracking-[-0.04em] text-gradient tabular-nums">
                {stats.conversion}%
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--a-muted)" }}>
                of registrations complete verification
              </p>
            </div>
          </div>

          <div className="a-panel flex flex-1 flex-wrap items-center rounded-2xl divide-x" style={{ borderColor: "var(--a-border)" }}>
            <Stat label="Total leads" value={stats.total} />
            <Stat label="Verified" value={stats.verified} />
            <Stat label="Pending" value={stats.pending} />
            <Stat label="Today" value={stats.today} />
            <Stat label="Last 7 days" value={stats.last7} />
            <Stat label="Last 30 days" value={stats.last30} />
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => applyFilter(() => setQ(e.target.value))}
          placeholder="Search name, email, phone, country"
          className="h-10 w-64 rounded-lg px-3 text-sm outline-none"
          style={{ background: "var(--a-raised)", border: "1px solid var(--a-border)", color: "var(--a-ink)" }}
        />
        <select
          value={status}
          onChange={(e) => applyFilter(() => setStatus(e.target.value as typeof status))}
          className="h-10 rounded-lg px-3 text-sm outline-none"
          style={{ background: "var(--a-raised)", border: "1px solid var(--a-border)", color: "var(--a-ink)" }}
        >
          <option value="all">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
        </select>
        <div className="flex h-10 items-center gap-1 rounded-lg p-1" style={{ border: "1px solid var(--a-border)" }}>
          {DATE_RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => applyFilter(() => setDays(r.days))}
              className="rounded px-2.5 py-1 text-xs transition"
              style={
                days === r.days
                  ? { background: "var(--a-accent-soft)", color: "var(--a-accent)" }
                  : { color: "var(--a-faint)" }
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg px-4 py-3 text-sm"
           style={{ border: "1px solid rgba(220,38,38,0.3)", background: "rgba(220,38,38,0.10)", color: theme === "dark" ? "#fca5a5" : "#b91c1c" }}>{error}</p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-2xl" style={{ border: "1px solid var(--a-border)", background: "var(--a-surface)" }}>
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-[11px] tracking-[0.14em] uppercase" style={{ background: "var(--a-raised)", color: "var(--a-faint)" }}>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  <button onClick={() => toggleSort(c.key)} className="transition">
                    {c.label}
                    {sort === c.key ? <span className="ml-1" style={{ color: "var(--a-accent)" }}>{dir === "asc" ? "↑" : "↓"}</span> : null}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Contact</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center" style={{ color: "var(--a-faint)" }}>
                  {loading ? "Loading…" : total === 0 ? "No leads yet." : "No leads match those filters."}
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                <Fragment key={l.id}>
                  <tr
                    onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                    className="cursor-pointer transition"
                    style={{
                      borderTop: "1px solid var(--a-border)",
                      background: fresh.has(l.id) ? "var(--a-accent-soft)" : undefined,
                    }}
                  >
                    <td className="px-4 py-3" style={{ color: "var(--a-ink)" }}>{l.name}</td>
                    <td className="px-4 py-3" style={{ color: "var(--a-muted)" }}>{l.email}</td>
                    <td className="px-4 py-3" style={{ color: "var(--a-muted)" }}>{l.country}</td>
                    <td className="px-4 py-3">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs"
                        style={
                          l.status === "verified"
                            ? { background: "var(--a-good-soft)", color: "var(--a-good)" }
                            : { background: "var(--a-accent-soft)", color: "var(--a-faint)" }
                        }
                      >
                        {l.status === "verified" ? "✓ verified" : "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--a-faint)" }}>{formatDate(l.created_at)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <a href={`mailto:${l.email}`} className="hover:underline" style={{ color: "var(--a-accent)" }}>
                        email
                      </a>
                      <span className="px-1.5" style={{ color: "var(--a-faint)" }}>·</span>
                      <a href={`tel:${l.phone}`} className="hover:underline" style={{ color: "var(--a-accent)" }}>
                        call
                      </a>
                      <CopyButton text={l.phone} title="Copy phone number" />
                    </td>
                  </tr>
                  {expanded === l.id ? (
                    <tr style={{ borderTop: "1px solid var(--a-border)", background: "var(--a-raised)" }}>
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid gap-x-8 gap-y-2 text-xs sm:grid-cols-2 lg:grid-cols-4" style={{ color: "var(--a-muted)" }}>
                          <p>
                            <span style={{ color: "var(--a-faint)" }}>Phone</span>{" "}
                            <span className="font-mono" style={{ color: "var(--a-ink)" }}>{l.phone}</span>
                          </p>
                          <p>
                            <span style={{ color: "var(--a-faint)" }}>Verified</span> {formatDate(l.verified_at)}
                          </p>
                          <p>
                            <span style={{ color: "var(--a-faint)" }}>IP</span> {l.ip || "—"}
                          </p>
                          <p className="truncate lg:col-span-1">
                            <span style={{ color: "var(--a-faint)" }}>Device</span> {l.user_agent || "—"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm" style={{ color: "var(--a-muted)" }}>
        <p>
          {total === 0
            ? "0 leads"
            : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 rounded-lg px-3 transition disabled:opacity-30" style={{ border: "1px solid var(--a-border)" }}
          >
            ‹ Prev
          </button>
          <span className="px-1">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="h-9 rounded-lg px-3 transition disabled:opacity-30" style={{ border: "1px solid var(--a-border)" }}
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
