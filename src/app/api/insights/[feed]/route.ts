import { NextResponse } from "next/server";
import { isFeed, loadFeed, REFRESH_SECONDS } from "@/lib/kvb";

/** Serves one Insights feed to the browser. KVB is only ever called from here. */
export async function GET(_req: Request, ctx: RouteContext<"/api/insights/[feed]">) {
  const { feed } = await ctx.params;
  if (!isFeed(feed)) {
    return NextResponse.json({ ok: false, error: "Unknown feed." }, { status: 404 });
  }

  const payload = await loadFeed(feed);
  if (!payload) {
    return NextResponse.json({ ok: false, error: "KVB's feed is not responding." }, { status: 503 });
  }

  // A stale answer is cached briefly so the CDN picks up KVB's recovery quickly.
  const maxAge = payload.stale ? 30 : REFRESH_SECONDS[feed];
  return NextResponse.json(
    { ok: true, ...payload },
    { headers: { "Cache-Control": `s-maxage=${maxAge}, stale-while-revalidate=${maxAge * 5}` } },
  );
}
