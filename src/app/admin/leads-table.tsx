"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] tracking-[0.16em] text-white/40 uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl text-white">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-white/35">{hint}</p> : null}
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
      className="ml-1.5 rounded px-1 text-[10px] text-white/30 transition hover:bg-white/10 hover:text-white/80"
    >
      {done ? "✓" : "copy"}
    </button>
  );
}

export function LeadsTable() {
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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-3xl text-white">Leads</p>
          <p className="mt-1 text-sm text-white/45">
            Updates every 30s{loading ? " · loading…" : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadCsv}
            className="h-10 rounded-lg border border-orange-400/40 bg-orange-500/10 px-4 text-sm text-orange-100 transition hover:bg-orange-500/20"
          >
            Export CSV
          </button>
          <button
            onClick={signOut}
            className="h-10 rounded-lg border border-white/12 px-4 text-sm text-white/60 transition hover:text-white"
          >
            Sign out
          </button>
        </div>
      </div>

      {stats ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Total" value={stats.total} />
          <Stat label="Verified" value={stats.verified} />
          <Stat label="Pending" value={stats.pending} />
          <Stat label="Conversion" value={`${stats.conversion}%`} hint="verified / total" />
          <Stat label="Today" value={stats.today} />
          <Stat label="30 days" value={stats.last30} hint={`${stats.last7} in last 7`} />
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => applyFilter(() => setQ(e.target.value))}
          placeholder="Search name, email, phone, country"
          className="h-10 w-64 rounded-lg border border-white/12 bg-[#111] px-3 text-sm text-white outline-none focus:border-orange-400/70"
        />
        <select
          value={status}
          onChange={(e) => applyFilter(() => setStatus(e.target.value as typeof status))}
          className="h-10 rounded-lg border border-white/12 bg-[#111] px-3 text-sm text-white outline-none focus:border-orange-400/70"
        >
          <option value="all">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
        </select>
        <div className="flex h-10 items-center gap-1 rounded-lg border border-white/12 p-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r.label}
              onClick={() => applyFilter(() => setDays(r.days))}
              className={`rounded px-2.5 py-1 text-xs transition ${
                days === r.days ? "bg-orange-500/20 text-orange-100" : "text-white/50 hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p>
      ) : null}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-white/[0.04] text-[11px] tracking-[0.14em] text-white/45 uppercase">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  <button onClick={() => toggleSort(c.key)} className="transition hover:text-white">
                    {c.label}
                    {sort === c.key ? <span className="ml-1 text-orange-300">{dir === "asc" ? "↑" : "↓"}</span> : null}
                  </button>
                </th>
              ))}
              <th className="px-4 py-3 font-medium">Contact</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-white/40">
                  {loading ? "Loading…" : total === 0 ? "No leads yet." : "No leads match those filters."}
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                <Fragment key={l.id}>
                  <tr
                    onClick={() => setExpanded(expanded === l.id ? null : l.id)}
                    className={`cursor-pointer border-t border-white/8 transition ${
                      fresh.has(l.id) ? "bg-orange-500/15" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <td className="px-4 py-3 text-white">{l.name}</td>
                    <td className="px-4 py-3 text-white/70">{l.email}</td>
                    <td className="px-4 py-3 text-white/60">{l.country}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          l.status === "verified"
                            ? "rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs text-emerald-300"
                            : "rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/50"
                        }
                      >
                        {l.status === "verified" ? "✓ verified" : "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50">{formatDate(l.created_at)}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <a href={`mailto:${l.email}`} className="text-orange-200 hover:underline">
                        email
                      </a>
                      <span className="px-1.5 text-white/20">·</span>
                      <a href={`tel:${l.phone}`} className="text-orange-200 hover:underline">
                        call
                      </a>
                      <CopyButton text={l.phone} title="Copy phone number" />
                    </td>
                  </tr>
                  {expanded === l.id ? (
                    <tr className="border-t border-white/8 bg-black/40">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="grid gap-x-8 gap-y-2 text-xs text-white/55 sm:grid-cols-2 lg:grid-cols-4">
                          <p>
                            <span className="text-white/35">Phone</span>{" "}
                            <span className="font-mono text-white/80">{l.phone}</span>
                          </p>
                          <p>
                            <span className="text-white/35">Verified</span> {formatDate(l.verified_at)}
                          </p>
                          <p>
                            <span className="text-white/35">IP</span> {l.ip || "—"}
                          </p>
                          <p className="truncate lg:col-span-1">
                            <span className="text-white/35">Device</span> {l.user_agent || "—"}
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/45">
        <p>
          {total === 0
            ? "0 leads"
            : `Showing ${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, total)} of ${total}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 rounded-lg border border-white/12 px-3 transition enabled:hover:text-white disabled:opacity-30"
          >
            ‹ Prev
          </button>
          <span className="px-1">
            {page} / {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="h-9 rounded-lg border border-white/12 px-3 transition enabled:hover:text-white disabled:opacity-30"
          >
            Next ›
          </button>
        </div>
      </div>
    </div>
  );
}
