"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ImgHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { Reveal } from "@/components/fx/Reveal";
import { Button } from "@/components/ui/button";
import type { AnalysisItem, CalendarEvent, Feed, FeedPayload, NewsItem, Signal } from "@/lib/kvb";

/** The server refreshes Newsflash every two minutes, so polling faster would gain nothing. */
const NEWSFLASH_POLL_MS = 120_000;

/** Same pair as the price ticker; direction is also carried by glyph and word, never colour alone. */
const UP = "#22c55e";
const DOWN = "#f05252";

const TABS: { feed: Feed; label: string; blurb: string }[] = [
  { feed: "analysis", label: "Market Analysis", blurb: "In-depth reads from KVB's research desk." },
  { feed: "calendar", label: "Economic Calendar", blurb: "The releases that move markets this week." },
  { feed: "newsflash", label: "Newsflash", blurb: "Market headlines as they land, every two minutes." },
  { feed: "signals", label: "AI Signal", blurb: "Intraday outlooks, instrument by instrument." },
];

const MARKET_LABEL: Record<string, string> = {
  forex: "Forex",
  commodities: "Commodities",
  indices: "Indices",
  crypto: "Crypto",
  shares: "Shares",
};

const IMPORTANCE_LABEL = { 1: "Low impact", 2: "Medium impact", 3: "High impact" } as const;

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

function timeAgo(seconds: number, now: number) {
  const mins = Math.max(0, Math.round((now / 1000 - seconds) / 60));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return dateFmt.format(seconds * 1000);
}

/** KVB's images come from its own CDN on signed URLs, so they are shown as-is rather than re-served by the optimiser. */
function KvbImage({ alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt={alt ?? ""} loading="lazy" decoding="async" {...props} />;
}

export function Insights() {
  const [active, setActive] = useState<Feed>("analysis");
  const [loaded, setLoaded] = useState<Partial<Record<Feed, FeedPayload>>>({});
  const [failed, setFailed] = useState<Partial<Record<Feed, boolean>>>({});
  const [now, setNow] = useState(() => Date.now());
  const requested = useRef(new Set<Feed>());
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const load = useCallback(async (feed: Feed) => {
    try {
      // The route's stale-while-revalidate is meant for the CDN; without no-cache the
      // browser applies it too and shows the previous refresh (a poll behind on Newsflash).
      const res = await fetch(`/api/insights/${feed}`, { cache: "no-cache" });
      const data = await res.json();
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Feed unavailable");
      setLoaded((prev) => ({ ...prev, [feed]: data as FeedPayload }));
      setFailed((prev) => ({ ...prev, [feed]: false }));
    } catch {
      setFailed((prev) => ({ ...prev, [feed]: true }));
    } finally {
      setNow(Date.now());
    }
  }, []);

  // Each tab loads the first time it is opened, so a visitor who never leaves
  // Market Analysis costs KVB nothing for the other three.
  useEffect(() => {
    if (requested.current.has(active)) return;
    requested.current.add(active);
    void load(active);
  }, [active, load]);

  useEffect(() => {
    if (active !== "newsflash") return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") void load("newsflash");
    }, NEWSFLASH_POLL_MS);
    return () => window.clearInterval(id);
  }, [active, load]);

  const retry = () => {
    setFailed((prev) => ({ ...prev, [active]: false }));
    void load(active);
  };

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = TABS.findIndex((t) => t.feed === active);
    const next =
      e.key === "ArrowRight" ? (current + 1) % TABS.length
      : e.key === "ArrowLeft" ? (current - 1 + TABS.length) % TABS.length
      : e.key === "Home" ? 0
      : e.key === "End" ? TABS.length - 1
      : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(TABS[next].feed);
    tabRefs.current[next]?.focus();
  };

  const tab = TABS.find((t) => t.feed === active) ?? TABS[0];
  const payload = loaded[active];

  return (
    <section id="insights" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.32em] text-orange-300/80">Insights · with KVB</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">
              Read the market
              <span className="block text-gradient">before you trade it.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="max-w-md font-serif text-lg leading-8 text-white/60">
            Research, the economic calendar, breaking headlines and intraday signals, straight from KVB, our
            brokerage partner.
          </Reveal>
        </div>

        <Reveal delay={0.12} className="panel mt-12 overflow-hidden rounded-[2rem]">
          <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 sm:pr-6">
            <div className="no-scrollbar -m-1 overflow-x-auto p-1">
              <div
                role="tablist"
                aria-label="Insights feeds"
                onKeyDown={onTabKey}
                className="flex w-max gap-1 rounded-full border border-white/10 bg-black/50 p-1"
              >
                {TABS.map((t, i) => {
                  const selected = t.feed === active;
                  return (
                    <button
                      key={t.feed}
                      ref={(el) => {
                        tabRefs.current[i] = el;
                      }}
                      type="button"
                      role="tab"
                      id={`insights-tab-${t.feed}`}
                      aria-selected={selected}
                      aria-controls="insights-panel"
                      tabIndex={selected ? 0 : -1}
                      onClick={() => setActive(t.feed)}
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 ${
                        selected
                          ? "bg-[linear-gradient(135deg,#ffb26a,#ff5a14_55%,#c91800)] text-white shadow-[0_0_24px_rgba(255,90,20,0.3)]"
                          : "text-white/65 hover:bg-white/8 hover:text-white"
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="px-2 text-xs leading-5 text-white/60 sm:px-0 sm:text-right">
              {tab.blurb}
              {payload?.stale ? " Showing the latest update we have." : ""}
            </p>
          </div>

          <div
            role="tabpanel"
            id="insights-panel"
            aria-labelledby={`insights-tab-${active}`}
            tabIndex={0}
            className="min-h-[420px] p-4 focus-visible:outline-none sm:p-6"
          >
            {payload ? (
              <FeedPanel payload={payload} now={now} />
            ) : failed[active] ? (
              <ErrorState onRetry={retry} />
            ) : (
              <LoadingState />
            )}
          </div>

          <div className="flex flex-col gap-4 border-t border-white/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="max-w-3xl text-xs leading-5 text-white/55">
              <span className="font-semibold text-white/80">Source: KVB.</span> Insights content is provided by KVB for
              information only. 31 Capitals does not provide investment advice. Trading leveraged products carries a
              high risk of losing your capital.
            </p>
            <Button asChild size="sm" className="shrink-0">
              <a href="#register">Open an account</a>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function FeedPanel({ payload, now }: { payload: FeedPayload; now: number }) {
  switch (payload.feed) {
    case "analysis":
      return <AnalysisPanel items={payload.items} />;
    case "calendar":
      return <CalendarPanel items={payload.items} now={now} />;
    case "newsflash":
      return <NewsflashPanel items={payload.items} now={now} />;
    case "signals":
      return <SignalsPanel items={payload.items} sample={payload.source === "sample"} />;
  }
}

/* ---------- Market Analysis ---------- */

function AnalysisPanel({ items }: { items: AnalysisItem[] }) {
  if (!items.length) return <EmptyState>No new analysis from KVB right now.</EmptyState>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((a) => (
        <Link
          key={a.id}
          href={`/insights/${a.id}`}
          className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 transition hover:border-orange-400/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70"
        >
          <div className="aspect-[16/9] overflow-hidden bg-white/[0.04]">
            {a.cover ? (
              <KvbImage
                src={a.cover}
                alt=""
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              />
            ) : null}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/55">{dateFmt.format(a.publishedAt * 1000)}</p>
            <h3 className="mt-2 line-clamp-2 font-display text-lg leading-snug text-white">{a.title}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/60">{a.summary}</p>
            <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold uppercase tracking-[0.18em] text-orange-200">
              Read analysis <ArrowUpRight size={14} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ---------- Economic Calendar ---------- */

const CAL_COLS = "sm:grid-cols-[3.5rem_5.5rem_minmax(0,1fr)_4.5rem_4.75rem_4.75rem_4.75rem]";

function CalendarPanel({ items, now }: { items: CalendarEvent[]; now: number }) {
  const [scope, setScope] = useState<"key" | "all">("key");

  const days = useMemo(() => {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const from = today.getTime() / 1000;
    const groups = new Map<string, { label: string; events: CalendarEvent[] }>();
    for (const e of items) {
      if (e.at < from || (scope === "key" && e.importance < 2)) continue;
      const d = new Date(e.at * 1000);
      const key = d.toDateString();
      let group = groups.get(key);
      if (!group) {
        const label = key === today.toDateString() ? `Today · ${dayFmt.format(d)}` : dayFmt.format(d);
        group = { label, events: [] };
        groups.set(key, group);
      }
      group.events.push(e);
    }
    return [...groups.values()];
  }, [items, now, scope]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label="Filter events" className="flex gap-1 rounded-full border border-white/10 bg-black/40 p-1">
          {(
            [
              ["key", "Key events"],
              ["all", "All events"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={scope === value}
              onClick={() => setScope(value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/70 ${
                scope === value ? "bg-white/12 text-white" : "text-white/60 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-white/55">Times in your local time zone</p>
      </div>

      {days.length === 0 ? (
        <EmptyState>No {scope === "key" ? "key " : ""}events left this week.</EmptyState>
      ) : (
        <div className="max-h-[560px] overflow-y-auto pr-1">
          <div
            className={`hidden gap-x-4 border-b border-white/10 pb-2 text-[11px] uppercase tracking-[0.18em] text-white/55 sm:grid ${CAL_COLS}`}
          >
            <span>Time</span>
            <span>Currency</span>
            <span>Event</span>
            <span>Impact</span>
            <span>Actual</span>
            <span>Forecast</span>
            <span>Previous</span>
          </div>
          {days.map((day) => (
            <div key={day.label}>
              <h3 className="sticky top-0 z-[1] bg-[#0b0908]/95 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-orange-200 backdrop-blur">
                {day.label}
              </h3>
              <ul>
                {day.events.map((e) => (
                  <CalendarRow key={e.id} event={e} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CalendarRow({ event: e }: { event: CalendarEvent }) {
  return (
    <li
      className={`grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 border-b border-white/5 py-3 sm:gap-x-4 ${CAL_COLS}`}
    >
      <span className="font-mono text-sm tabular-nums text-white/70">{timeFmt.format(e.at * 1000)}</span>
      <span className="flex items-center gap-2 text-sm font-semibold text-white/85" title={e.country}>
        {e.flag ? <KvbImage src={e.flag} alt="" className="h-3.5 w-5 rounded-[2px] object-cover" /> : null}
        {e.currency}
      </span>
      <span className="order-1 col-span-3 text-sm leading-6 text-white sm:order-none sm:col-span-1">{e.name}</span>
      <Importance level={e.importance} />
      <div className="order-2 col-span-3 flex flex-wrap gap-x-5 gap-y-1 sm:contents">
        <Value label="Actual" value={e.actual} strong />
        <Value label="Forecast" value={e.forecast} />
        <Value label="Previous" value={e.previous} />
      </div>
    </li>
  );
}

function Value({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <span className="font-mono text-xs tabular-nums sm:text-sm">
      <span className="font-sans text-white/50 sm:hidden">{label} </span>
      <span className={value ? (strong ? "font-semibold text-white" : "text-white/70") : "text-white/35"}>
        {value || "—"}
      </span>
    </span>
  );
}

function Importance({ level }: { level: 1 | 2 | 3 }) {
  return (
    <span className="flex items-center gap-1.5 justify-self-end sm:justify-self-start" title={IMPORTANCE_LABEL[level]}>
      <span className="sr-only">{IMPORTANCE_LABEL[level]}</span>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className={`h-2 w-2 rotate-45 rounded-[1px] ${
            i > level ? "bg-white/15" : level === 3 ? "bg-orange-400" : "bg-orange-200/80"
          }`}
        />
      ))}
    </span>
  );
}

/* ---------- Newsflash ---------- */

function NewsflashPanel({ items, now }: { items: NewsItem[]; now: number }) {
  if (!items.length) return <EmptyState>No headlines from KVB right now.</EmptyState>;
  return (
    <ul className="max-h-[560px] divide-y divide-white/5 overflow-y-auto pr-1">
      {items.map((n) => (
        <li key={n.id} className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-4 py-3.5">
          <span className="pt-0.5">
            <time
              dateTime={new Date(n.publishedAt * 1000).toISOString()}
              className="block font-mono text-sm tabular-nums text-white/75"
            >
              {timeFmt.format(n.publishedAt * 1000)}
            </time>
            <span className="block text-[11px] text-white/50">{timeAgo(n.publishedAt, now)}</span>
          </span>
          <p className={`text-sm leading-6 ${n.important ? "font-medium text-white" : "text-white/75"}`}>{n.title}</p>
        </li>
      ))}
    </ul>
  );
}

/* ---------- AI Signal ---------- */

function SignalsPanel({ items, sample }: { items: Signal[]; sample: boolean }) {
  return (
    <div>
      {sample ? (
        <p className="mb-5 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
          <span className="font-semibold">Sample layout.</span> These are example KVB signals, not live ones. The live
          AI Signal feed connects once KVB shares its API.
        </p>
      ) : null}
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((s) => (
            <article key={s.id} className="flex flex-col rounded-2xl border border-white/10 bg-black/40 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl tracking-[-0.02em] text-white">{s.symbol}</h3>
                <Direction direction={s.direction} />
              </div>
              <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-white/55">
                {MARKET_LABEL[s.market] ?? s.market} · {s.term}
              </p>
              <p className="mt-4 text-sm font-semibold text-white">{s.title}</p>
              <p className="mt-1.5 text-sm leading-6 text-white/60">{s.summary}</p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState>No signals from KVB right now.</EmptyState>
      )}
      <p className="mt-5 text-xs leading-5 text-white/55">
        Signals are produced by a third-party provider for KVB and shown for information only. They are not investment
        advice or a recommendation from 31 Capitals.
      </p>
    </div>
  );
}

function Direction({ direction }: { direction: Signal["direction"] }) {
  const up = direction === "up";
  const color = up ? UP : DOWN;
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]"
      style={{ color, borderColor: `${color}66` }}
    >
      {up ? "▲ Upside" : "▼ Downside"}
    </span>
  );
}

/* ---------- states ---------- */

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
      <span className="sr-only">Loading from KVB…</span>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
      <p className="font-display text-2xl text-white">KVB&apos;s feed isn&apos;t responding.</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-white/60">
        This usually clears within a minute. Try again, or check back shortly.
      </p>
      <Button variant="outline" size="sm" className="mt-6" onClick={onRetry}>
        <RefreshCw size={14} /> Try again
      </Button>
    </div>
  );
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center text-center text-sm text-white/60">{children}</div>
  );
}
