import sanitizeHtml from "sanitize-html";

/**
 * KVB's public Insights API: the same endpoints kvbplus.com uses. KVB's IT team
 * confirmed they need no key, cookie or auth. Only this server calls them; the
 * browser talks to /api/insights, so KVB sees one request per refresh window
 * rather than one per visitor.
 */
const KVB_API = "https://www.kvbplus.com/api/v1/pro";
const KVB_SITE = "https://www.kvbplus.com";
const TIMEOUT_MS = 8_000;

/** Column ids in KVB's CMS. */
const COLUMN = { analysis: 13, newsflash: 4 } as const;

/** The countries KVB's own calendar page requests. */
const CALENDAR_COUNTRIES =
  "10001,10002,10003,10004,10005,10006,10007,10008,10009,10010,10011,10017,10021,10036,20724,20076,16";

/** Seconds between refreshes. Newsflash moves fastest; analysis is written a few times a day. */
export const REFRESH_SECONDS = { analysis: 1800, calendar: 600, newsflash: 120, signals: 900 } as const;

export type Feed = keyof typeof REFRESH_SECONDS;

export function isFeed(value: string): value is Feed {
  return Object.hasOwn(REFRESH_SECONDS, value);
}

export type AnalysisItem = {
  id: number;
  title: string;
  summary: string;
  cover: string | null;
  publishedAt: number;
};

export type NewsItem = { id: number; title: string; publishedAt: number; important: boolean };

export type CalendarEvent = {
  id: number;
  at: number;
  country: string;
  flag: string;
  currency: string;
  name: string;
  importance: 1 | 2 | 3;
  actual: string;
  forecast: string;
  previous: string;
};

export type Signal = {
  id: number;
  symbol: string;
  market: string;
  term: string;
  title: string;
  summary: string;
  direction: "up" | "down";
  publishedAt: number;
};

type Meta = { source: "kvb" | "sample"; stale: boolean };

export type FeedPayload =
  | ({ feed: "analysis"; items: AnalysisItem[] } & Meta)
  | ({ feed: "calendar"; items: CalendarEvent[] } & Meta)
  | ({ feed: "newsflash"; items: NewsItem[] } & Meta)
  | ({ feed: "signals"; items: Signal[] } & Meta);

export type Article = {
  id: number;
  title: string;
  summary: string;
  html: string;
  publishedAt: number;
  author: string;
};

/* ---------- transport ---------- */

type Envelope<T> = { code: number; data: T | null };

async function kvb<T>(path: string, revalidate: number, body?: unknown): Promise<T> {
  const res = await fetch(`${KVB_API}/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { accept: "application/json", "content-type": "application/json", lang: "en-US" },
    body: body === undefined ? undefined : JSON.stringify(body),
    // Caching is opt-in, and force-cache is what lets the POST list endpoint be cached at all.
    cache: "force-cache",
    next: { revalidate },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`KVB ${path} answered ${res.status}`);

  const json = (await res.json()) as Envelope<T>;
  if (json.code !== 0 || !json.data) throw new Error(`KVB ${path} returned code ${json.code}`);
  return json.data;
}

/* ---------- feeds ---------- */

type RawArticle = {
  articleId: number;
  title: string;
  summary?: string;
  seoDescription?: string;
  cover?: string;
  content?: string;
  author?: string;
  important?: boolean;
  publishTime: number;
};

type RawEvent = {
  id: number;
  weightiness: string;
  countryName: string;
  countryIcon: string;
  currencyCode: string;
  content: string;
  previous: string;
  predict: string;
  currentValue: string;
  unit: string;
  publishTime: number;
};

async function listArticles(columnId: number, pageSize: number, revalidate: number) {
  const data = await kvb<{ items?: RawArticle[] }>("cms2/article/list", revalidate, { columnId, pageSize });
  return data.items ?? [];
}

async function loadAnalysis(): Promise<AnalysisItem[]> {
  const rows = await listArticles(COLUMN.analysis, 6, REFRESH_SECONDS.analysis);
  return rows.map((r) => ({
    id: r.articleId,
    title: r.title,
    summary: r.summary || r.seoDescription || "",
    cover: r.cover || null,
    publishedAt: r.publishTime,
  }));
}

async function loadNewsflash(): Promise<NewsItem[]> {
  const rows = await listArticles(COLUMN.newsflash, 15, REFRESH_SECONDS.newsflash);
  return rows.map((r) => ({
    id: r.articleId,
    title: r.title,
    publishedAt: r.publishTime,
    important: Boolean(r.important),
  }));
}

/** [shorten from, divide by, suffix]. Thousands start at 10K so "1250.5" keeps its decimals. */
const SCALES = [
  [1e9, 1e9, "B"],
  [1e6, 1e6, "M"],
  [1e4, 1e3, "K"],
] as const;

/**
 * KVB sends raw figures ("-340000000000.000") with the unit apart, and currency
 * units carry a zero-width space ("£\u200B"). Large figures are shortened the way
 * calendars print them ("-£340B"); small ones keep KVB's own precision ("0.3%").
 */
function formatValue(raw: string, rawUnit: string) {
  if (raw === "") return "";
  const unit = rawUnit.replace(/\p{Cf}/gu, "").trim();
  const n = Number(raw);
  if (!Number.isFinite(n)) return `${raw}${unit}`;

  const abs = Math.abs(n);
  const scale = SCALES.find(([from]) => abs >= from);
  const digits = scale ? `${Number((abs / scale[1]).toFixed(2))}${scale[2]}` : raw.replace(/^-/, "");
  const sign = n < 0 ? "-" : "";
  return unit === "%" || unit === "" ? `${sign}${digits}${unit}` : `${sign}${unit}${digits}`;
}

async function loadCalendar(): Promise<CalendarEvent[]> {
  // The window is snapped to UTC midnight so the URL, and with it the cache key, only
  // changes once a day. It opens a day early so visitors east of UTC still get all of
  // their "today"; the browser drops anything before local midnight.
  const day = 86_400;
  const start = Math.floor(Date.now() / 1000 / day) * day - day;
  const end = start + 8 * day;
  const query =
    `startTime=${start}&endTime=${end}&publish=0&area=en&weightiness=1,2,3` +
    `&countryCode=${CALENDAR_COUNTRIES}`;

  const data = await kvb<{ items?: RawEvent[] }>(`social/news/calendar/query?${query}`, REFRESH_SECONDS.calendar);
  // KVB can list the same release more than once under different ids.
  const seen = new Set<string>();
  return (data.items ?? [])
    .filter((r) => {
      const key = `${r.publishTime}|${r.currencyCode}|${r.content}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((r) => ({
      id: r.id,
      at: r.publishTime,
      country: r.countryName,
      flag: r.countryIcon,
      currency: r.currencyCode,
      name: r.content,
      importance: Math.min(3, Math.max(1, Number(r.weightiness) || 1)) as 1 | 2 | 3,
      actual: formatValue(r.currentValue, r.unit),
      forecast: formatValue(r.predict, r.unit),
      previous: formatValue(r.previous, r.unit),
    }))
    .sort((a, b) => a.at - b.at);
}

/**
 * AI Signal is the one feed whose list API KVB has not published. Until KVB IT
 * shares it, the tab shows these: real KVB signals captured on 11 Sep 2026, served
 * with source "sample" so the page labels them as a layout preview. Replace this
 * with a loader like the others once the address arrives.
 */
const SAMPLE_SIGNALS: Signal[] = [
  { id: 765786, symbol: "XAUUSD", market: "commodities", term: "Intraday", title: "Target 4,281", summary: "The downside prevails as long as 4,398 is resistance, with 4,281 and 4,250 as targets.", direction: "down", publishedAt: 1789102860 },
  { id: 765779, symbol: "EURUSD", market: "forex", term: "Intraday", title: "Decline at a crossroads", summary: "The downside prevails as long as 1.1649 is resistance, with 1.1597 and 1.1584 as targets.", direction: "down", publishedAt: 1789102800 },
  { id: 765782, symbol: "USDJPY", market: "forex", term: "Intraday", title: "155.01 expected", summary: "The upside prevails as long as 153.30 is support, with 155.01 and 155.43 as targets.", direction: "up", publishedAt: 1789102860 },
  { id: 765874, symbol: "USOIL", market: "commodities", term: "Intraday", title: "The upside prevails", summary: "Long positions above 98.50 with targets at 104.70 and 107.00 in extension.", direction: "up", publishedAt: 1789103040 },
  { id: 765780, symbol: "GBPUSD", market: "forex", term: "Intraday", title: "Critical support closing in", summary: "The downside prevails as long as 1.3554 is resistance, with 1.3496 and 1.3481 as targets.", direction: "down", publishedAt: 1789102860 },
  { id: 765785, symbol: "XAGUSD", market: "commodities", term: "Intraday", title: "Key support level approaches", summary: "The downside prevails as long as 65.55 is resistance, with 62.97 and 62.34 as targets.", direction: "down", publishedAt: 1789102860 },
  { id: 765924, symbol: "BTCUSD", market: "crypto", term: "Intraday", title: "Watching for a trigger below support", summary: "The downside prevails as long as 79,214 is resistance, with 76,372 and 75,595 as targets.", direction: "down", publishedAt: 1789105500 },
  { id: 765925, symbol: "ETHUSD", market: "crypto", term: "Intraday", title: "2,503 expected", summary: "Our next up target stands at 2,520.", direction: "up", publishedAt: 1789105500 },
];

async function fetchFeed(feed: Feed): Promise<FeedPayload> {
  const meta = { source: "kvb" as const, stale: false };
  switch (feed) {
    case "analysis":
      return { feed, items: await loadAnalysis(), ...meta };
    case "calendar":
      return { feed, items: await loadCalendar(), ...meta };
    case "newsflash":
      return { feed, items: await loadNewsflash(), ...meta };
    case "signals":
      return { feed, items: SAMPLE_SIGNALS, source: "sample", stale: false };
  }
}

/** Last good answer per feed, so a KVB outage shows slightly old content instead of an error. */
const lastGood = new Map<Feed, FeedPayload>();

export async function loadFeed(feed: Feed): Promise<FeedPayload | null> {
  try {
    const payload = await fetchFeed(feed);
    lastGood.set(feed, payload);
    return payload;
  } catch (err) {
    console.error(`[kvb] ${feed} feed failed:`, err);
    const previous = lastGood.get(feed);
    return previous ? { ...previous, stale: true } : null;
  }
}

/* ---------- articles ---------- */

function absoluteKvbUrl(href: string | undefined) {
  if (!href) return href;
  return href.startsWith("/") && !href.startsWith("//") ? `${KVB_SITE}${href}` : href;
}

/**
 * Article bodies are HTML from KVB's CMS. It is rendered on our domain, so it is
 * cut down to the formatting tags KVB actually uses: no scripts, styles, iframes
 * or event handlers survive, and links open on KVB's site.
 */
function cleanArticleHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: [
      "h2", "h3", "h4", "p", "br", "hr", "strong", "b", "em", "i", "u",
      "ul", "ol", "li", "blockquote", "aside", "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "width", "height", "loading"],
    },
    allowedSchemes: ["https"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, href: absoluteKvbUrl(attribs.href) ?? "", target: "_blank", rel: "noopener noreferrer nofollow" },
      }),
      img: sanitizeHtml.simpleTransform("img", { loading: "lazy" }),
    },
  });
}

export async function getArticle(id: string): Promise<Article | null> {
  if (!/^\d{1,10}$/.test(id)) return null;
  try {
    const raw = await kvb<RawArticle>(`cms2/article/detail/${id}`, REFRESH_SECONDS.analysis);
    return {
      id: raw.articleId,
      title: raw.title,
      summary: raw.summary || raw.seoDescription || "",
      html: cleanArticleHtml(raw.content ?? ""),
      publishedAt: raw.publishTime,
      author: raw.author || "KVB",
    };
  } catch (err) {
    console.error(`[kvb] article ${id} failed:`, err);
    return null;
  }
}
