import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Atmosphere } from "@/components/fx/Atmosphere";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { getArticle } from "@/lib/kvb";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export async function generateMetadata({ params }: PageProps<"/insights/[id]">): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) return { title: "Insights | 31 Capitals" };
  return { title: `${article.title} | 31 Capitals Insights`, description: article.summary || undefined };
}

export default async function InsightArticlePage({ params }: PageProps<"/insights/[id]">) {
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return (
    <>
      <Atmosphere />
      <Header />
      <main className="relative z-[2] px-4 pt-32 pb-24 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <Link
            href="/#insights"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/60 hover:text-white"
          >
            <ArrowLeft size={14} /> Back to Insights
          </Link>

          <p className="mt-10 text-xs uppercase tracking-[0.32em] text-orange-300/80">Market Analysis · Source: KVB</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.04] font-semibold tracking-[-0.04em] text-balance text-white sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 text-sm text-white/60">
            {dateFmt.format(article.publishedAt * 1000)} · {article.author}
          </p>

          {article.html ? (
            <div className="kvb-article mt-10" dangerouslySetInnerHTML={{ __html: article.html }} />
          ) : (
            <p className="mt-10 font-serif text-xl leading-9 text-white/75">{article.summary}</p>
          )}

          <p className="mt-12 border-t border-white/10 pt-6 text-xs leading-5 text-white/55">
            This article is provided by KVB for information only. It is not investment advice or a recommendation from
            31 Capitals. Trading leveraged products carries a high risk of losing your capital.
          </p>

          <div className="panel-hot mt-10 flex flex-col gap-5 rounded-[2rem] p-7 sm:flex-row sm:items-center sm:justify-between sm:p-9">
            <div>
              <p className="font-display text-2xl text-white">Ready to put this to work?</p>
              <p className="mt-1 text-sm text-white/65">Verify once with 31 Capitals and open your KVB account.</p>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/#register">Open an account</Link>
            </Button>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
