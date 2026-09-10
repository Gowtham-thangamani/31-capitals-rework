"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

export type AdminTheme = "dark" | "light";

const STORAGE_KEY = "31c-admin-theme";

/** Saved preference, else the OS setting. */
function readTheme(): AdminTheme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage blocked (private window) — fall through to the OS preference */
  }
  return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function subscribe(onChange: () => void) {
  const mq = window.matchMedia?.("(prefers-color-scheme: light)");
  mq?.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  return () => {
    mq?.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useAdminTheme() {
  // useSyncExternalStore keeps the server snapshot ("dark") separate from the
  // client one, so the preference is picked up without a setState-in-effect and
  // without a hydration mismatch.
  const systemTheme = useSyncExternalStore<AdminTheme>(subscribe, readTheme, () => "dark");
  const [override, setOverride] = useState<AdminTheme | null>(null);
  const theme = override ?? systemTheme;

  useEffect(() => {
    document.querySelectorAll(".admin-scope").forEach((el) => el.setAttribute("data-theme", theme));
  }, [theme]);

  const setTheme = (next: AdminTheme) => {
    setOverride(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* preference simply won't persist */
    }
  };

  return { theme, setTheme };
}

export function ThemeToggle({ theme, onChange }: { theme: AdminTheme; onChange: (t: AdminTheme) => void }) {
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="flex h-10 w-10 items-center justify-center rounded-lg transition"
      style={{ border: "1px solid var(--a-border)", color: "var(--a-muted)" }}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
