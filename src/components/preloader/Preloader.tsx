"use client";

import { useEffect, useState } from "react";
import { DiamondMark } from "@/components/brand/Logo";

export function Preloader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 1400;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        frame = requestAnimationFrame(tick);
      } else {
        setLeaving(true);
        setTimeout(onDone, 350);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[80] flex flex-col items-center justify-center bg-[#050505] transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <DiamondMark className="h-16 w-auto" />
      <p className="mt-6 font-display text-xl tracking-[-0.04em] text-white">31 Capitals</p>
      <div className="mt-8 h-px w-28 overflow-hidden bg-white/10">
        <div className="h-full bg-orange-500 transition-[width] duration-150" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}
