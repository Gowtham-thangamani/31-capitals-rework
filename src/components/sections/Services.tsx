"use client";

import Image from "next/image";
import { Reveal } from "@/components/fx/Reveal";

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
        {/* Full-bleed artwork, masked at the edges so it melts into the panel rather
            than ending on a hard rectangle. The left edge fades hardest, since that is
            where it meets the copy. */}
        <div
          className="relative h-[360px] min-h-[360px] overflow-hidden lg:h-auto"
          style={{
            maskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 22%, #000 46%), linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskImage:
              "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.6) 22%, #000 46%), linear-gradient(to bottom, transparent 0%, #000 14%, #000 86%, transparent 100%)",
            WebkitMaskComposite: "source-in",
          }}
        >
          <Image
            src="/brand/bull-v5.jpg"
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-cover"
          />
        </div>
      </Reveal>
    </section>
  );
}
