"use client";

import { useCallback, useState } from "react";
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
import { Register } from "@/components/sections/Register";

export default function Home() {
  const [ready, setReady] = useState(false);
  const onDone = useCallback(() => setReady(true), []);

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
            <Register />
          </main>
          <Footer />
        </>
      ) : null}
    </>
  );
}
