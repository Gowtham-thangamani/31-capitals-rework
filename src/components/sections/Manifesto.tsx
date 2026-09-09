"use client";

import { Reveal } from "@/components/fx/Reveal";

export function Manifesto() {
  return (
    <section className="relative overflow-hidden px-4 pt-16 pb-28 sm:px-6 sm:pt-20">
      <p className="pointer-events-none absolute -right-10 top-10 select-none font-display text-[28vw] leading-none font-extrabold text-white/[0.035]">
        31
      </p>
      <div className="relative mx-auto max-w-7xl">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.4em] text-orange-300/80">Manifesto</p>
        </Reveal>
        <Reveal delay={0.05}>
          <h2 className="mt-6 font-display text-[12vw] leading-[0.92] font-semibold tracking-[-0.05em] text-white sm:text-[7.5vw]">
            We introduce.
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <h2 className="font-display text-[12vw] leading-[0.92] font-semibold tracking-[-0.05em] text-gradient sm:text-[7.5vw]">
            We educate.
          </h2>
        </Reveal>
        <Reveal delay={0.18}>
          <h2 className="font-display text-[12vw] leading-[0.92] font-semibold tracking-[-0.05em] text-white sm:text-[7.5vw]">
            We stay.
          </h2>
        </Reveal>
        <Reveal delay={0.24} className="mt-10 max-w-2xl font-serif text-xl leading-8 text-white/65 sm:text-2xl">
          31 Capitals is a premium, partner-focused financial markets house — known for transparency, personal support,
          and strong connections into established brokerage.
        </Reveal>
      </div>
    </section>
  );
}
