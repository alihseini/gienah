"use client";
import React from "react";
import {
  ScrollProgress, useOffscreenPause, useLayerChoreography, useSectionEntrance, useParallax, siteStyles as s,
} from "./helpers";
import { Nav } from "./Nav";
import { LogoTicker } from "./LogoTicker";
import { SectionConnector } from "./SectionConnector";
import { JourneyGate } from "./JourneyGate";
import { Hero, Services, Featured, MoreProducts, Agile, About, Contact, Footer } from "./sections";

export function SiteApp() {
  useOffscreenPause();
  useLayerChoreography();
  useSectionEntrance();
  useParallax();

  // each connector activates the next section when its line reaches the node.
  // Once activated a section stays activated (the map only ever gains keys).
  const [active, setActive] = React.useState<Record<string, boolean>>({});
  const activate = React.useCallback((k: string) => setActive((a) => (a[k] ? a : { ...a, [k]: true })), []);
  const onServices = React.useCallback(() => activate("services"), [activate]);
  const onProducts = React.useCallback(() => activate("products"), [activate]);
  const onStudio = React.useCallback(() => activate("studio"), [activate]);
  const onAgile = React.useCallback(() => activate("agile"), [activate]);
  const onContact = React.useCallback(() => activate("contact"), [activate]);

  // reduced motion → never gate; reveal everything immediately
  React.useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive({ services: true, products: true, studio: true, agile: true, contact: true });
    }
  }, []);

  return (
    <div className={s.site}>
      <ScrollProgress />
      <Nav />
      <Hero />
      <LogoTicker />
      {/* section-to-section constellation chain (Hero→Services→Products→Our Studio
          →Agile→Contact). Direction alternates right/left/right… for the zig-zag.
          Each connector drives the reveal of the section it points at (the section
          stays in its pre-reveal state until the line arrives). About is not a star
          in the journey, so the Agile→Contact link sits just before Contact. */}
      <SectionConnector dir="right" onArrive={onServices} />
      <JourneyGate ready={!!active.services}><Services /></JourneyGate>
      <SectionConnector dir="left" onArrive={onProducts} />
      <JourneyGate ready={!!active.products}><Featured /></JourneyGate>
      <SectionConnector dir="right" onArrive={onStudio} />
      <JourneyGate ready={!!active.studio}><MoreProducts /></JourneyGate>
      <SectionConnector dir="left" onArrive={onAgile} />
      <JourneyGate ready={!!active.agile}><Agile /></JourneyGate>
      <About />
      <SectionConnector dir="right" onArrive={onContact} />
      <JourneyGate ready={!!active.contact}><Contact /></JourneyGate>
      <Footer />
    </div>
  );
}
