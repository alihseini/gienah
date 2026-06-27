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
      {/* prototype: first section-to-section connector (Hero → Services) */}
      <SectionConnector />
      <Services />
      <Featured />
      <MoreProducts />
      <Agile />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}
