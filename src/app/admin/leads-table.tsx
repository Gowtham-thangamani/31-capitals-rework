"use client";

import { useMemo, useState } from "react";
import type { Lead } from "@/lib/leads";

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
}

function toCsv(rows: Lead[]) {
  const header = ["Name", "Email", "Phone", "Country", "Status", "Submitted", "Verified"];
  const escape = (v: string) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = rows.map((r) =>
    [r.name, r.email, r.phone, r.country, r.status, r.created_at ?? "", r.verified_at ?? ""]
      .map(escape)
      .join(","),
  );
  return [header.map(escape).join(","), ...lines].join("\n");
}

export function LeadsTable({ leads }: { leads: Lead[] }) {
  const [q, setQ] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return leads.filter((l) => {
      if (onlyVerified && l.status !== "verified") return false;
      if (!needle) return true;
      return [l.name, l.email, l.phone, l.country].some((f) => f?.toLowerCase().includes(needle));
    });
  }, [leads, q, onlyVerified]);

  const verifiedCount = useMemo(() => leads.filter((l) => l.status === "verified").length, [leads]);

  function downloadCsv() {
    const blob = new Blob([toCsv(filtered)], { type: "text/csv;charset=utf-8" });
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
          <p className="mt-1 text-sm text-white/50">
            {leads.length} total · {verifiedCount} verified · {leads.length - verifiedCount} pending
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone"
            className="h-10 w-56 rounded-lg border border-white/12 bg-[#111] px-3 text-sm text-white outline-none focus:border-orange-400/70"
          />
          <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-white/12 px-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              className="accent-orange-500"
            />
            Verified only
          </label>
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

      <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-white/[0.04] text-[11px] tracking-[0.14em] text-white/45 uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Country</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-white/40">
                  {leads.length === 0 ? "No leads yet." : "No leads match that search."}
                </td>
              </tr>
            ) : (
              filtered.map((l) => (
                <tr key={l.id} className="border-t border-white/8">
                  <td className="px-4 py-3 text-white">{l.name}</td>
                  <td className="px-4 py-3 text-white/70">{l.email}</td>
                  <td className="px-4 py-3 font-mono text-white/70">{l.phone}</td>
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
