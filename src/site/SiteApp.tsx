"use client";
import React from "react";
import {
  ScrollProgress, useOffscreenPause, useLayerChoreography, useSectionEntrance, useParallax, siteStyles as s,
} from "./helpers";
import { Nav } from "./Nav";
import { LogoTicker } from "./LogoTicker";
import { SectionConnector } from "./SectionConnector";
import { Hero, Services, Featured, MoreProducts, Agile, About, Contact, Footer } from "./sections";

export function SiteApp() {
  useOffscreenPause();
  useLayerChoreography();
  useSectionEntrance();
  useParallax();
  return (
    <div className={s.site}>
      <ScrollProgress />
      <Nav />
      <Hero />
      <LogoTicker />
      {/* section-to-section constellation chain (Hero→Services→Products→Our Studio
          →Agile→Contact). Direction alternates right/left/right… for the zig-zag.
          About is not a star in the journey, so the Agile→Contact link sits in the
          transition zone right before Contact. */}
      <SectionConnector dir="right" />
      <Services />
      <SectionConnector dir="left" />
      <Featured />
      <SectionConnector dir="right" />
      <MoreProducts />
      <SectionConnector dir="left" />
      <Agile />
      <About />
      <SectionConnector dir="right" />
      <Contact />
      <Footer />
    </div>
  );
}
