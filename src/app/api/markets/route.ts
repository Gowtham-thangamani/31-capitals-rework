import { NextResponse } from "next/server";

export type Quote = {
  symbol: string;
  price: number;
  changePct: number;
};

/** Instruments shown in the ticker, in display order. */
const INSTRUMENTS = [
  { symbol: "BTC", binance: "BTCUSDT", gecko: "bitcoin" },
  { symbol: "ETH", binance: "ETHUSDT", gecko: "ethereum" },
  { symbol: "XRP", binance: "XRPUSDT", gecko: "ripple" },
  { symbol: "SOL", binance: "SOLUSDT", gecko: "solana" },
  { symbol: "BNB", binance: "BNBUSDT", gecko: "binancecoin" },
  { symbol: "DOGE", binance: "DOGEUSDT", gecko: "dogecoin" },
  { symbol: "ADA", binance: "ADAUSDT", gecko: "cardano" },
  { symbol: "LINK", binance: "LINKUSDT", gecko: "chainlink" },
];

const REVALIDATE_SECONDS = 10;

type BinanceRow = { symbol: string; lastPrice: string; priceChangePercent: string };

/** Primary source. Note: api.binance.com answers 451 from US IPs, hence the fallback. */
async function fromBinance(): Promise<Quote[] | null> {
  const symbols = JSON.stringify(INSTRUMENTS.map((i) => i.binance));
  const url = `https://api.binance.com/api/v3/ticker/24hr?symbols=${encodeURIComponent(symbols)}`;

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) return null;

  const rows = (await res.json()) as BinanceRow[];
  if (!Array.isArray(rows)) return null;

  const bySymbol = new Map(rows.map((r) => [r.symbol, r]));
  const quotes = INSTRUMENTS.flatMap((i) => {
    const row = bySymbol.get(i.binance);
    if (!row) return [];
    const price = Number(row.lastPrice);
    const changePct = Number(row.priceChangePercent);
    if (!Number.isFinite(price) || !Number.isFinite(changePct)) return [];
    return [{ symbol: i.symbol, price, changePct }];
  });

  return quotes.length ? quotes : null;
}

type GeckoRow = { usd?: number; usd_24h_change?: number };

async function fromCoinGecko(): Promise<Quote[] | null> {
  const ids = INSTRUMENTS.map((i) => i.gecko).join(",");
  const url =
    `https://api.coingecko.com/api/v3/simple/price?ids=${ids}` +
    `&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url, { next: { revalidate: REVALIDATE_SECONDS } });
  if (!res.ok) return null;

  const data = (await res.json()) as Record<string, GeckoRow>;
  const quotes = INSTRUMENTS.flatMap((i) => {
    const row = data?.[i.gecko];
    const price = row?.usd;
    const changePct = row?.usd_24h_change;
    if (!Number.isFinite(price) || !Number.isFinite(changePct)) return [];
    return [{ symbol: i.symbol, price: price as number, changePct: changePct as number }];
  });

  return quotes.length ? quotes : null;
}

export async function GET() {
  for (const source of [fromBinance, fromCoinGecko]) {
    try {
      const quotes = await source();
      if (quotes) {
        return NextResponse.json(
          { ok: true, quotes, fetchedAt: Date.now() },
          { headers: { "Cache-Control": `s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=30` } },
        );
      }
    } catch {
      // try the next source
    }
  }

  return NextResponse.json({ ok: false, quotes: [] as Quote[] }, { status: 503 });
}
