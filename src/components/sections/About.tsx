"use client";

import { Reveal } from "@/components/fx/Reveal";
import { TiltCard } from "@/components/fx/TiltCard";

const pillars = [
  {
    n: "01",
    title: "Independent IB brand",
    copy: "A marketing and Introducing Broker house — not a broker. We connect the right clients and partners with established brokerage companies.",
  },
  {
    n: "02",
    title: "Trusted introductions",
    copy: "We introduce traders to established brokerage so they can access global markets on professional platforms, with a house that remains responsible for the relationship.",
  },
  {
    n: "03",
    title: "Human support",
    copy: "From first conversation to live trading, a dedicated desk stays with you. Premium does not mean distant — it means reachable.",
  },
];

export function About() {
  return (
    <section id="about" className="relative px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.32em] text-orange-300/80">The house</p>
          <h2 className="mt-4 max-w-4xl font-display text-5xl leading-[0.92] font-semibold tracking-[-0.05em] text-white sm:text-7xl">
            Professional. Trusted.
            <span className="block text-gradient">Partner-focused.</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="mt-8 max-w-2xl font-serif text-xl leading-8 text-white/65 sm:text-2xl">
          Known for transparency, personal support, and strong connections. Market insights, educational content,
          onboarding assistance, and ongoing client and partner support — through registration and after go-live.
        </Reveal>
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {pillars.map((item, i) => (
            <Reveal key={item.n} delay={0.08 * i}>
              <TiltCard className="panel group relative min-h-[280px] overflow-hidden rounded-[1.75rem] p-7">
                <p className="font-serif text-6xl text-orange-400/50 transition group-hover:text-orange-300">{item.n}</p>
                <h3 className="mt-8 font-display text-2xl text-white sm:text-3xl">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/55">{item.copy}</p>
                <div className="pointer-events-none absolute -right-8 -bottom-10 h-32 w-32 rotate-12 bg-[linear-gradient(135deg,#ffb26a,#c91800)] opacity-30 [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]" />
              </TiltCard>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
