"use client";
import React from "react";
import {
  ScrollProgress, useOffscreenPause, useLayerChoreography, useSectionEntrance, siteStyles as s,
} from "./helpers";
import { Nav } from "./Nav";
import { LogoTicker } from "./LogoTicker";
import { Hero, Services, Featured, MoreProducts, Agile, About, Contact, Footer } from "./sections";

export function SiteApp() {
  useOffscreenPause();
  useLayerChoreography();
  useSectionEntrance();
  return (
    <div className={s.site}>
      <ScrollProgress />
      <Nav />
      <Hero />
      <LogoTicker />
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
