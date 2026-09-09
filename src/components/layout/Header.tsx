"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";

const links = [
  { href: "#about", label: "About" },
  { href: "#clients", label: "Clients" },
  { href: "#partners", label: "Partners" },
  { href: "#markets", label: "Markets" },
  { href: "#register", label: "Open account" },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <a href="#top" className="rounded-full border border-white/10 bg-black/50 px-3 py-2 backdrop-blur-xl">
          <Logo markClassName="h-9 w-auto" wordmarkClassName="h-[22px] w-auto" priority />
        </a>
        <nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur-xl md:flex">
          {links.slice(0, 4).map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-full px-3.5 py-2 text-xs font-medium uppercase tracking-[0.16em] text-white/70 hover:bg-white/8 hover:text-white"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="shine hidden sm:inline-flex">
            <a href="#register">Start verification</a>
          </Button>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="mx-4 rounded-2xl border border-white/10 bg-black/95 p-4 backdrop-blur-xl md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-3 text-sm text-white/80 hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
        </div>
      ) : null}
    </header>
  );
}
