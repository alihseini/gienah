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

// One continuous zig-zag through the page. Each section explicitly declares the
// side the line ENTERS (lands on the title node) and the side it EXITS — a strict
// alternating pattern so the journey reads as one unbroken line:
//   Hero → Services(in R, out L) → Products(in L, out R) → Studio(in R, out L)
//        → Agile(in L, out R) → Contact(in R).
// The exit of one section sits on the same edge as the entry of the next, so each
// inter-section leg hugs a single side and the chain never crosses ambiguously.
type Side = "l" | "r";
const SECTIONS: { key: string; enter: Side; exit: Side }[] = [
  { key: "services", enter: "r", exit: "l" },
  { key: "products", enter: "l", exit: "r" },
  { key: "studio", enter: "r", exit: "l" },
  { key: "agile", enter: "l", exit: "r" },
  { key: "contact", enter: "r", exit: "l" }, // last section: exit leg is unused
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
