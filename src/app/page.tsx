"use client";

import { useCallback, useEffect, useState } from "react";
import { Preloader } from "@/components/preloader/Preloader";
import { Atmosphere } from "@/components/fx/Atmosphere";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Manifesto } from "@/components/sections/Manifesto";
import { Platforms } from "@/components/sections/Platforms";
import { Services } from "@/components/sections/Services";
import { Clients } from "@/components/sections/Clients";
import { Partners } from "@/components/sections/Partners";
import { Markets } from "@/components/sections/Markets";
import { Insights } from "@/components/sections/Insights";
import { Register } from "@/components/sections/Register";

export default function Home() {
  const [ready, setReady] = useState(false);
  const onDone = useCallback(() => setReady(true), []);

  // Sections only mount once the preloader finishes, so a deep link such as /#insights
  // (the article pages link back that way) has nothing to land on at first paint.
  useEffect(() => {
    if (!ready || !window.location.hash) return;
    document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView();
  }, [ready]);

  return (
    <>
      {!ready ? <Preloader onDone={onDone} /> : null}
      {ready ? (
        <>
          <Atmosphere />
          <Header />
          <main className="relative z-[2]">
            {/* The ticker lives inside <Hero /> so it always lands on the first screen. */}
            <Hero />
            <Manifesto />
            <About />
            <Platforms />
            <Services />
            <Clients />
            <Partners />
            <Markets />
            <Insights />
            <Register />
          </main>
          <Footer />
        </>
      ) : null}
    </>
  );
}
