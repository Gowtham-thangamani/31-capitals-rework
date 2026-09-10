"use client";

import { FormEvent, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { DiamondMark, Wordmark } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ThemeToggle, useAdminTheme } from "@/app/admin/theme-toggle";

export function LoginForm() {
  const { theme, setTheme } = useAdminTheme();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not sign in.");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      <div className="flex justify-end">
        <ThemeToggle theme={theme} onChange={setTheme} />
      </div>

      <div className="relative flex min-h-[70vh] items-center justify-center">
        {/* The mark carries the page: oversized and dim, sitting behind the form */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <DiamondMark className="h-[520px] w-auto opacity-[0.07]" />
        </div>

        <div className="relative w-full max-w-[380px]">
          <div className="mb-9 flex flex-col items-center">
            <DiamondMark className="h-12 w-auto" priority />
            <Wordmark className="mt-4 h-[26px] w-auto" priority onLight={theme === "light"} />
          </div>

          <div
            className="rounded-[1.75rem] p-8"
            style={{
              background: "var(--a-surface)",
              border: "1px solid var(--a-border)",
              boxShadow: theme === "dark" ? "0 0 90px rgba(255,74,16,0.10)" : "0 18px 50px rgba(23,18,14,0.09)",
            }}
          >
            <h1 className="font-display text-[26px] leading-tight tracking-[-0.035em]" style={{ color: "var(--a-ink)" }}>
              Sign in to leads
            </h1>
            <p className="mt-2 text-sm leading-6" style={{ color: "var(--a-muted)" }}>
              Registrations and their verification status.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-4">
              <div>
                <Label htmlFor="password" style={{ color: "var(--a-muted)" }}>
                  Password
                </Label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  required
                  className="mt-1.5 h-12 w-full rounded-xl px-4 text-sm outline-none transition"
                  style={{
                    background: "var(--a-raised)",
                    border: "1px solid var(--a-border)",
                    color: "var(--a-ink)",
                  }}
                />
              </div>

              {error ? (
                <p
                  className="rounded-xl px-3.5 py-2.5 text-sm leading-5"
                  style={{ background: "rgba(220,38,38,0.10)", border: "1px solid rgba(220,38,38,0.3)", color: theme === "dark" ? "#fca5a5" : "#b91c1c" }}
                >
                  {error}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="shine w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" size={16} /> : null}
                Sign in
              </Button>
            </form>
          </div>

          <p className="mt-7 flex items-center justify-center gap-2 text-[11px]" style={{ color: "var(--a-faint)" }}>
            <ShieldCheck size={13} style={{ color: "var(--a-accent)" }} />
            Holds customer contact details. Sign out when you finish.
          </p>
        </div>
      </div>
    </div>
  );
}
