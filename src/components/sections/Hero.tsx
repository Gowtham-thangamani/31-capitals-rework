"use client";

import { motion } from "framer-motion";
import { KvbPartner } from "@/components/brand/KvbLogo";
import { DiamondMark } from "@/components/brand/Logo";
import { MarketTicker } from "@/components/fx/MarketTicker";
import { Button } from "@/components/ui/button";

export function Hero() {
  // No opaque background on the section: the drifting orange orbs in <Atmosphere />
  // sit behind the page, so painting the hero solid would hide them entirely.
  // The section is a flex column exactly one screen tall: the content takes up the
  // slack and the ticker is pinned to the bottom. Nothing reserves a fixed height
  // for the ticker, so it can never be pushed below the fold when its text wraps.
  return (
    <section id="top" className="relative isolate flex min-h-svh flex-col overflow-hidden">
      {/* Orange splash — a warm bloom behind the mark, a second lower-left accent,
          and a soft floor fade so the ticker band still reads as a hard edge. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_75%_38%,rgba(255,90,20,0.34),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_45%_40%_at_12%_78%,rgba(255,122,40,0.14),transparent_72%)]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#050505]" />

      {/* flex-1 absorbs whatever is left after the ticker, so the content stays
          centred in the remaining space instead of leaving a gap under the buttons. */}
      {/* lg:items-end bottom-aligns the copy with the mark, so the buttons finish on
          the same line as the diamond instead of leaving a gap beneath them. */}
      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 pt-24 pb-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-[11px] tracking-[0.32em] text-white/45 uppercase">
            Independent introducing broker
          </p>
          <h1 className="font-display mt-6 text-5xl leading-[0.92] font-semibold tracking-[-0.06em] text-white sm:text-7xl">
            31 Capitals
          </h1>
          <p className="mt-6 max-w-md text-base leading-8 text-white/60 sm:text-lg">
            We connect traders and partners with established brokerage — with personal
            onboarding and a desk that stays.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <a href="#register">Start verification</a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="#about">About the house</a>
            </Button>
          </div>
          <KvbPartner className="mt-8" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.12 }}
          className="flex justify-center lg:justify-end"
        >
          {/* Sized to fill the centred hero rather than leaving empty space around it.
              The svh cap keeps it from overflowing short laptop screens, and w-auto
              preserves the official artwork's aspect ratio. */}
          <DiamondMark className="h-[240px] w-auto sm:h-[340px] lg:h-[min(540px,60svh)]" />
        </motion.div>
      </div>

      {/* Last child of the flex column: always sits at the bottom of the first screen. */}
      <MarketTicker />
    </section>
  );
}
