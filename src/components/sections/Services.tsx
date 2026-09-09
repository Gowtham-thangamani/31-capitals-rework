"use client";

import dynamic from "next/dynamic";
import { Reveal } from "@/components/fx/Reveal";

const ChartScene = dynamic(() => import("@/components/canvas/ChartScene").then((m) => m.ChartScene), { ssr: false });

const items = [
  "Market insights written for active traders",
  "Educational content for new and growing desks",
  "Onboarding assistance through account registration",
  "Ongoing client and partner support after go-live",
];

export function Services() {
  return (
    <section className="px-4 py-16 sm:px-6">
      <Reveal className="panel mx-auto grid max-w-7xl overflow-hidden rounded-[2.2rem] lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative p-8 sm:p-12">
          <p className="text-xs uppercase tracking-[0.32em] text-orange-300/80">What we provide</p>
          <h2 className="mt-4 font-display text-4xl leading-[0.92] font-semibold tracking-[-0.04em] text-white sm:text-6xl">
            Insight, education, and a desk that does not disappear.
          </h2>
          <ul className="mt-10 space-y-5">
            {items.map((item) => (
              <li key={item} className="flex gap-4 text-sm leading-6 text-white/70">
                <span className="mt-1 diamond-bullet shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative h-[360px] bg-[radial-gradient(circle_at_center,rgba(255,74,16,0.16),transparent_60%)] lg:h-auto">
          <ChartScene />
        </div>
      </Reveal>
    </section>
  );
}
