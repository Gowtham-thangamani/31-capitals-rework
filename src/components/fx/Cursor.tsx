"use client";

import { useEffect, useState } from "react";

export function Cursor() {
  const [pos, setPos] = useState({ x: -80, y: -80 });
  const [hot, setHot] = useState(false);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)");
    if (!fine.matches) return;
    document.documentElement.classList.add("has-cursor");
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement | null;
      setHot(Boolean(target?.closest("a, button, [data-cursor='hot']")));
    };
    window.addEventListener("mousemove", move);
    return () => {
      window.removeEventListener("mousemove", move);
      document.documentElement.classList.remove("has-cursor");
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed z-[90] hidden md:block"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) scale(${hot ? 1.55 : 1})`,
        transition: "transform 180ms ease",
        mixBlendMode: "difference",
      }}
    >
      <div className="h-4 w-4 rotate-45 border border-white bg-white/20" />
    </div>
  );
}
