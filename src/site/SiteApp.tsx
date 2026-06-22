"use client";
import React from "react";
import {
  ScrollProgress, Marquee, useOffscreenPause, useLayerChoreography, useSectionEntrance, siteStyles as s,
} from "./helpers";
import { Nav } from "./Nav";
import { Hero, Services, Featured, MoreProducts, Agile, About, Careers, Contact, Footer } from "./sections";
import site from "@/data/site.json";

export function SiteApp() {
  useOffscreenPause();
  useLayerChoreography();
  useSectionEntrance();
  return (
    <div className={s.site}>
      <ScrollProgress />
      <Nav />
      <Hero />
      <Marquee items={site.marquee} />
      <Services />
      <Featured />
      <MoreProducts />
      <Agile />
      <About />
      <Careers />
      <Contact />
      <Footer />
    </div>
  );
}
