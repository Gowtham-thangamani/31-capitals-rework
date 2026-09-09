"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import type { Quote } from "@/app/api/markets/route";

const POLL_MS = 10_000;

/**
 * Direction is carried by the arrow glyph and the signed number as well as by colour:
 * red/green are indistinguishable to deuteranopes (ΔE 4.1), so colour alone would not
 * communicate up vs down. Both steps clear 4.5:1 on this band.
 */
const UP = "#22c55e";
const DOWN = "#f05252";

function formatPrice(price: number) {
  // Small coins need more precision; min 2 keeps "104.50" while trimming "12.4820" -> "12.482".
  const digits = price >= 100 ? 2 : price >= 1 ? 4 : 6;
  return price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: digits,
  });
}

function QuoteItem({ quote }: { quote: Quote }) {
  const up = quote.changePct >= 0;
  return (
    <span className="flex shrink-0 items-center gap-2.5 px-5">
      <span className="text-sm font-semibold tracking-[0.08em] text-white/85">{quote.symbol}</span>
      <span className="font-mono text-sm tabular-nums text-white">{formatPrice(quote.price)}</span>
      <span className="font-mono text-xs tabular-nums" style={{ color: up ? UP : DOWN }}>
        {up ? "▲" : "▼"} {up ? "+" : "−"}
        {Math.abs(quote.changePct).toFixed(2)}%
      </span>
    </span>
  );
}

function SkeletonItem({ symbol }: { symbol: string }) {
  return (
    <span className="flex shrink-0 items-center gap-2.5 px-5">
      <span className="text-sm font-semibold tracking-[0.08em] text-white/45">{symbol}</span>
      <span className="font-mono text-sm tabular-nums text-white/25">——.——</span>
    </span>
  );
}

/** Returns the quotes, or null if the request failed or came back empty. */
async function fetchQuotes(): Promise<Quote[] | null> {
  try {
    const res = await fetch("/api/markets");
    const data = await res.json();
    if (data?.ok && Array.isArray(data.quotes) && data.quotes.length) return data.quotes as Quote[];
    return null;
  } catch {
    return null;
  }
}

const PLACEHOLDERS = ["BTC", "ETH", "XRP", "SOL", "BNB", "DOGE", "ADA", "LINK"];

export function MarketTicker() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stale, setStale] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);

  const applyResult = useCallback((next: Quote[] | null) => {
    if (next && next.length) {
      setQuotes(next);
      setStale(false);
    } else {
      // Keep the last good prices on screen rather than blanking the bar.
      setStale(true);
    }
  }, []);

  useEffect(() => {
    // Reduced motion is handled in CSS (the track's animation is removed); those
    // users still get live price updates, just without the scroll.
    let cancelled = false;

    const tick = async () => {
      const next = await fetchQuotes();
      if (!cancelled) applyResult(next);
    };

    void tick();

    const id = window.setInterval(() => {
      // Don't poll a tab nobody is looking at.
      if (document.visibilityState !== "visible" || pausedRef.current) return;
      void tick();
    }, POLL_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible" && !pausedRef.current) void tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [applyResult]);

  const togglePause = () => {
    setPaused((p) => {
      const next = !p;
      pausedRef.current = next;
      if (!next) void fetchQuotes().then(applyResult);
      return next;
    });
  };

  const hasData = quotes.length > 0;
  const live = hasData && !stale;
  const items = hasData
    ? quotes.map((q) => <QuoteItem key={q.symbol} quote={q} />)
    : PLACEHOLDERS.map((s) => <SkeletonItem key={s} symbol={s} />);

  return (
    <div className="border-y border-orange-500/25 bg-gradient-to-r from-[#1a0702] via-black to-[#1a0702]">
      <div
        className="flex items-stretch"
        role="region"
        aria-label="Live cryptocurrency prices"
      >
        {/* Status cluster */}
        <div className="z-20 flex shrink-0 items-center gap-2.5 border-r border-orange-500/25 bg-black/60 px-4 py-3 sm:px-5">
          <span className="flex items-center gap-2">
            <span
              className={`h-2 w-2 rounded-full ${live ? "animate-pulse" : ""}`}
              style={{ background: live ? DOWN : "#6b6b6b" }}
            />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
              {live ? "Live" : hasData ? "Delayed" : "…"}
            </span>
          </span>
          <button
            type="button"
            onClick={togglePause}
            aria-label={paused ? "Resume price ticker" : "Pause price ticker"}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-orange-400/60 hover:text-white"
          >
            {paused ? <Play size={12} /> : <Pause size={12} />}
          </button>
        </div>

        {/* Scrolling quotes */}
        <div className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-black to-transparent" />
          <div
            className="ticker-track flex w-max items-center py-3"
            style={{ animationPlayState: paused ? "paused" : "running" }}
          >
            {items}
            {/* duplicated for a seamless -50% loop */}
            <span aria-hidden className="flex">
              {items}
            </span>
          </div>
        </div>
      </div>

      <p className="border-t border-white/5 px-4 py-1.5 text-center text-[10px] leading-4 text-white/30 sm:px-5">
        Prices indicative, for information only — not a quote or an offer to trade.
      </p>
    </div>
  );
}
