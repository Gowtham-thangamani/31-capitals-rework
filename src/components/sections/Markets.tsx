"use client";

import Image from "next/image";
import { Reveal } from "@/components/fx/Reveal";

// Swap to "/brand/markets-globe-alt-v2.png" for the wider planet render.
// Filenames carry a version suffix: the optimiser and the browser both cache by
// URL, so re-cropping the artwork needs a new name to actually take effect.
const GLOBE_IMAGE = "/brand/markets-globe-v2.png";

const regions = ["Americas", "Europe", "Africa", "Middle East", "Asia", "Oceania"];

export function Markets() {
  return (
    <section id="markets" className="px-4 py-24 sm:px-6">
      <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.32em] text-orange-300/80">Coverage</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.045em] text-white sm:text-6xl">
            Built for
            <span className="block text-gradient">the whole world.</span>
          </h2>
          <p className="mt-6 font-serif text-lg leading-8 text-white/60">
            Clients and partners in every region — a desk that works across time zones, languages, and onboarding
            realities.
          </p>
          <div className="mt-8 flex flex-wrap gap-2">
            {regions.map((name) => (
              <span
                key={name}
                className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-orange-100"
              >
                {name}
              </span>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.12} className="relative h-[460px]">
          <Image
            src={GLOBE_IMAGE}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1024px) 100vw, 55vw"
            className="object-contain p-2 sm:p-3"
          />
        </Reveal>
      </div>
    </section>
  );
}
