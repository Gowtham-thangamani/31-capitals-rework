"use client";

import { Reveal } from "@/components/fx/Reveal";

const perks = [
  { title: "Commissions", copy: "Competitive payouts based on client trading activity." },
  { title: "Dedicated desk", copy: "Account support for IBs and Sub-IBs, not a shared inbox." },
  { title: "Onboarding", copy: "Assistance for every introduced client through account registration." },
  { title: "Materials", copy: "Marketing assets ready for regional campaigns." },
  { title: "Tracking", copy: "Performance you can actually read — activity, deposits, rebates." },
  { title: "Training", copy: "Ongoing coaching for desks that want to grow, not stall." },
];

export function Partners() {
  return (
    <section id="partners" className="px-4 py-10 sm:px-6">
      <Reveal className="panel-hot relative mx-auto max-w-7xl overflow-hidden rounded-[2.2rem] p-8 sm:p-12">
        <p className="pointer-events-none absolute -right-4 top-8 hidden select-none font-display text-[10rem] leading-none text-white/[0.04] lg:block">
          IB
        </p>
        <p className="text-xs uppercase tracking-[0.32em] text-orange-200/80">For partners & Sub-IBs</p>
        <h2 className="mt-4 max-w-3xl font-display text-5xl leading-[0.92] font-semibold tracking-[-0.05em] text-white sm:text-7xl">
          Introduce clients.
          <span className="block text-gradient">Earn on activity.</span>
        </h2>
        <p className="mt-6 max-w-2xl font-serif text-xl leading-8 text-white/65">
          Partnership opportunities let you introduce clients and earn commissions based on their trading activity —
          with the same personal support we give to traders.
        </p>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {perks.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <p className="font-display text-lg text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-white/55">{item.copy}</p>
            </div>
          ))}
        </div>
        <a href="#register" className="mt-10 inline-flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-orange-200">
          Start a partner conversation →
        </a>
      </Reveal>
    </section>
  );
}
