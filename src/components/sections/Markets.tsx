"use client";

import Image from "next/image";
import { Reveal } from "@/components/fx/Reveal";

// Filenames carry a version suffix: the optimiser and the browser both cache by
// URL, so re-cropping the artwork needs a new name to actually take effect.
const GLOBE_IMAGE = "/brand/markets-globe-v2.png";

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
