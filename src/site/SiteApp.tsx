"use client";
import React from "react";
import {
  ScrollProgress, useOffscreenPause, useLayerChoreography, useSectionEntrance, useLayeredSections, siteStyles as s,
} from "./helpers";
import { Nav } from "./Nav";
import { LogoTicker } from "./LogoTicker";
import { ScrollSection } from "./ScrollSection";
import { Hero, Services, Featured, MoreProducts, Agile, About, Contact, Footer } from "./sections";

export function SiteApp() {
  useOffscreenPause();
  useLayerChoreography();
  useSectionEntrance();
  useLayeredSections();
  return (
    <div className={s.site}>
      <ScrollProgress />
      <Nav />
      {/* Sticky-driven sections (Services, Products, Agile) keep their own scroll
          mechanics — wrapping them in a moving transform would break sticky pinning. */}
      <ScrollSection layer={1}><Hero /></ScrollSection>
      <LogoTicker />
      <Services />
      <Featured />
      <ScrollSection layer={2}><MoreProducts /></ScrollSection>
      <Agile />
      <ScrollSection layer={3}><About /></ScrollSection>
      <ScrollSection layer={4}><Contact /></ScrollSection>
      <Footer />
    </div>
  );
}
