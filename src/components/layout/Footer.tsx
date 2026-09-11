import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function Footer() {
  return (
    <footer className="relative z-[2] overflow-hidden border-t border-white/10 bg-black px-4 py-16 sm:px-6">
      <p className="pointer-events-none absolute -bottom-16 left-0 select-none font-display text-[22vw] leading-none font-extrabold text-white/[0.03]">
        31
      </p>
      <div className="relative mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo markClassName="h-9 w-auto" wordmarkClassName="h-[22px] w-auto" />
          <p className="mt-5 max-w-md font-serif text-lg leading-8 text-white/55">
            An independent marketing and Introducing Broker brand connecting traders and business partners with
            established brokerage companies.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/40">Navigate</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-white/70">
            <Link href="/#about">About</Link>
            <Link href="/#clients">Clients</Link>
            <Link href="/#partners">Partners</Link>
            <Link href="/#insights">Insights</Link>
            <Link href="/#register">Open account</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/40">Markets</p>
          <p className="mt-4 text-sm leading-6 text-white/70">
            Coverage worldwide — with a desk that stays across every time zone.
          </p>
        </div>
      </div>
      <div className="relative mx-auto mt-12 max-w-7xl space-y-4 border-t border-white/8 pt-8 text-[11px] leading-5 text-white/40">
        <p>
          Risk warning: Trading foreign exchange, CFDs, derivatives and other leveraged financial products carries a
          high level of risk to your capital and may not be suitable for all investors. You should only trade with
          money you can afford to lose. Please ensure that you fully understand the risks involved and seek independent
          advice if necessary.
        </p>
        <p>
          31 Capitals is not a brokerage company, does not hold client funds, and does not provide investment advice.
          Clients contract only with the brokerage entity identified in their account opening documents. Products, services and regulatory protections vary by
          jurisdiction. 31 Capitals works with clients and partners worldwide.
        </p>
        <p>© {new Date().getFullYear()} 31 Capitals. All rights reserved.</p>
      </div>
    </footer>
  );
}
