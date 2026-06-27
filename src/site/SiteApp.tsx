"use client";
import React from "react";
import {
  ScrollProgress, useOffscreenPause, useLayerChoreography, useSectionEntrance, useParallax, siteStyles as s,
} from "./helpers";
import { Nav } from "./Nav";
import { LogoTicker } from "./LogoTicker";
import { ConstellationJourney } from "./ConstellationJourney";
import { JourneyGate } from "./JourneyGate";
import { Hero, Services, Featured, MoreProducts, Agile, About, Contact, Footer } from "./sections";

// one continuous zig-zag through the page: Hero → Services(L) → Products(R) →
// Studio(L) → Agile(R) → Contact(L). `enter` is the side the line lands on; it
// exits the opposite side and crosses to the next section's entry side.
const SECTIONS: { key: string; enter: "l" | "r" }[] = [
  { key: "services", enter: "l" },
  { key: "products", enter: "r" },
  { key: "studio", enter: "l" },
  { key: "agile", enter: "r" },
  { key: "contact", enter: "l" },
];

export function SiteApp() {
  useOffscreenPause();
  useLayerChoreography();
  useSectionEntrance();
  useParallax();

  // the constellation line activates the next section when its head reaches that
  // section's title node. Once activated a section stays activated (the map only
  // ever gains keys), so the reveal runs once and stays revealed.
  const [active, setActive] = React.useState<Record<string, boolean>>({});
  const activate = React.useCallback((k: string) => setActive((a) => (a[k] ? a : { ...a, [k]: true })), []);

  // reduced motion → never gate; reveal everything immediately
  React.useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive({ services: true, products: true, studio: true, agile: true, contact: true });
    }
  }, []);

  return (
    <div className={s.site}>
      <ScrollProgress />
      {/* one page-wide overlay line travelling through every section's title node,
          entering/exiting from alternating sides. It measures the Hero star + the
          title nodes, draws on scroll, and fires `activate` as it arrives at each
          section so that section's reveal runs. About is not a star in the journey. */}
      <ConstellationJourney sections={SECTIONS} onArrive={activate} />
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
  );
}
