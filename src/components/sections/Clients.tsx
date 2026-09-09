"use client";

import { Reveal } from "@/components/fx/Reveal";

const perks = [
  {
    n: "01",
    title: "Personalized onboarding",
    copy: "A guided path from first enquiry to a live trading account — documents, platforms and funding explained in plain language.",
  },
  {
    n: "02",
    title: "Fast support",
    copy: "When markets move, you should not wait in a generic queue. Our desk stays close to your account.",
  },
  {
    n: "03",
    title: "Market insights",
    copy: "Concise briefings on FX, metals, indices and regional flows — written for desks in every session.",
  },
  {
    n: "04",
    title: "Education",
    copy: "From platform walkthroughs to risk basics, we help clients trade with more clarity, not more noise.",
  },
];

export function Clients() {
  return (
    <section id="clients" className="px-4 py-24 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.32em] text-orange-300/80">For clients</p>
            <h2 className="mt-3 max-w-xl font-display text-5xl font-semibold tracking-[-0.05em] text-white sm:text-7xl">
              A journey with a house, not a form.
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="max-w-md font-serif text-lg leading-8 text-white/60">
            Personalized onboarding, fast support, market insights, educational content, and ongoing assistance —
            from registration through live trading.
          </Reveal>
        </div>
        <div className="mt-14 grid gap-px overflow-hidden rounded-[2rem] border border-white/10 bg-white/10 sm:grid-cols-2">
          {perks.map((p, i) => (
            <Reveal key={p.n} delay={i * 0.06} className="bg-[#080808] p-8">
              <p className="font-serif text-5xl text-orange-400/55">{p.n}</p>
              <h3 className="mt-5 font-display text-3xl text-white">{p.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/55">{p.copy}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
