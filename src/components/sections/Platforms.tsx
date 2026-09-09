"use client";

import { Reveal } from "@/components/fx/Reveal";
import { TiltCard } from "@/components/fx/TiltCard";

const platforms = [
  { name: "MetaTrader 4", detail: "The industry standard for FX and CFD desks.", tag: "MT4" },
  { name: "MetaTrader 5", detail: "Multi-asset charts, depth of market, one-click execution.", tag: "MT5" },
  { name: "Mobile app", detail: "News, watchlists and account tools in one mobile terminal.", tag: "APP" },
  { name: "Desktop", detail: "Desktop trading for Windows and macOS with advanced order control.", tag: "DESK" },
];

export function Platforms() {
  return (
    <section className="px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.32em] text-orange-300/80">Platforms</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-white sm:text-6xl">
            Professional platforms.
            <span className="block text-gradient">Global markets.</span>
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {platforms.map((p, i) => (
            <Reveal key={p.name} delay={i * 0.07}>
              <TiltCard className="panel min-h-[220px] rounded-[1.5rem] p-6">
                <p className="font-serif text-4xl text-orange-300/55">{p.tag}</p>
                <p className="mt-8 font-display text-xl text-white">{p.name}</p>
                <p className="mt-2 text-sm leading-6 text-white/50">{p.detail}</p>
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
