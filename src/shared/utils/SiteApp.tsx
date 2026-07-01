"use client";
import React from "react";
import {
  ScrollProgress, useOffscreenPause, useLayerChoreography, useSectionEntrance, useParallax, siteStyles as s,
} from "./helpers";
import { Nav } from "./nav/Nav";
import { LogoTicker } from "./logoTicker/LogoTicker";
import { JourneyGate, JourneyActivateProvider } from "./journeyGate/JourneyGate";
import { Hero, Services, Featured, MoreProducts, Agile, About, Contact, Footer } from "../components/sections";

/* Constellation journey — now PER SECTION (no page-wide overlay). Each section
   mounts its own SectionConnector that draws its slice of the line behind that
   section's content (see SectionConnector.tsx). The journey reads:
     Hero ↘ Services(in L)  Products(in R)  Studio(in L)  Agile(in R, gap, exit low)
            ↘ About (pass-through, left lane)  ↘ Contact(in L).
   Each connector calls activate(key) when the line reaches that section's entry
   node, flipping its JourneyGate to ready so the section reveals once (and stays). */

export function SiteApp() {
  useOffscreenPause();
  useLayerChoreography();
  useSectionEntrance();
  useParallax();

  const [active, setActive] = React.useState<Record<string, boolean>>({});
  const activate = React.useCallback((k: string) => setActive((a) => (a[k] ? a : { ...a, [k]: true })), []);

  // reduced motion → never gate; reveal everything immediately
  React.useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive({ services: true, products: true, studio: true, agile: true, contact: true });
    }
  }, []);

  return (
    <JourneyActivateProvider activate={activate}>
      <div className={s.site}>
        <ScrollProgress />
        <Nav />
        <Hero />
        <LogoTicker />
        <JourneyGate ready={!!active.services}><Services /></JourneyGate>
        <JourneyGate ready={!!active.products}><Featured /></JourneyGate>
        <JourneyGate ready={!!active.studio}><MoreProducts /></JourneyGate>
        <JourneyGate ready={!!active.agile}><Agile /></JourneyGate>
        <About />
        <JourneyGate ready={!!active.contact}><Contact /></JourneyGate>
        <Footer />
      </div>
    </JourneyActivateProvider>
  );
}
