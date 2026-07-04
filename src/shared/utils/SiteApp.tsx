"use client";
import React from "react";
import dynamic from "next/dynamic";
import {
  ScrollProgress, useOffscreenPause, useLayerChoreography, useSectionEntrance, useParallax, siteStyles as s,
} from "./helpers";
import { Nav } from "./nav/Nav";
import { LogoTicker } from "./logoTicker/LogoTicker";
import { JourneyGate, JourneyActivateProvider } from "./journeyGate/JourneyGate";
import { Hero } from "../components/sections/heroSection/HeroSection";
import { HomeStarBackdrop } from "./homeStarBackdrop/HomeStarBackdrop";
import { useVisualBudget } from "./visualBudget";
import {
  loadAgileSection,
  loadFeaturedProductsSection,
  loadServicesSection,
  PREWARM_ATTR,
  useHomepageSectionPrewarm,
} from "./homepagePrewarm";

const Services = dynamic(() => loadServicesSection().then((m) => m.Services));
const Featured = dynamic(() => loadFeaturedProductsSection().then((m) => m.Featured));
const MoreProducts = dynamic(() => import("../components/sections/studioSection/StudioSection").then((m) => m.MoreProducts));
const Agile = dynamic(() => loadAgileSection().then((m) => m.Agile));
const About = dynamic(() => import("../components/sections/aboutSection/AboutSection").then((m) => m.About));
const Contact = dynamic(() => import("../components/sections/contactSection/ContactSection").then((m) => m.Contact));
const Footer = dynamic(() => import("../components/sections/footerSection/FooterSection").then((m) => m.Footer));

const prewarmMarkerStyle: React.CSSProperties = {
  display: "block",
  height: 1,
  marginBottom: -1,
  overflow: "hidden",
  pointerEvents: "none",
  visibility: "hidden",
};

/* Constellation journey — now PER SECTION (no page-wide overlay). Each section
   mounts its own SectionConnector that draws its slice of the line behind that
   section's content (see SectionConnector.tsx). The journey reads:
     Hero ↘ Services(in L)  Products(in R)  Studio(in L)  Agile(in R, gap, exit low)
            ↘ About (pass-through, left lane)  ↘ Contact(in L).
   Each connector calls activate(key) when the line reaches that section's entry
   node, flipping its JourneyGate to ready so the section reveals once (and stays). */

export function SiteApp() {
  const visualBudget = useVisualBudget();
  useOffscreenPause();
  useLayerChoreography();
  useSectionEntrance();
  useParallax();
  useHomepageSectionPrewarm(visualBudget);

  const [active, setActive] = React.useState<Record<string, boolean>>({});
  const activate = React.useCallback((k: string) => setActive((a) => (a[k] ? a : { ...a, [k]: true })), []);

  // reduced motion → never gate; reveal everything immediately
  React.useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActive({ services: true, products: true, studio: true, agile: true, contact: true });
    }
  }, []);

  React.useEffect(() => {
    document.documentElement.dataset.visualBudget = visualBudget;
    document.body.dataset.visualBudget = visualBudget;

    return () => {
      if (document.documentElement.dataset.visualBudget === visualBudget) delete document.documentElement.dataset.visualBudget;
      if (document.body.dataset.visualBudget === visualBudget) delete document.body.dataset.visualBudget;
    };
  }, [visualBudget]);

  return (
    <JourneyActivateProvider activate={activate}>
      <div className={s.site} data-visual-budget={visualBudget}>
        <HomeStarBackdrop visualBudget={visualBudget} />
        <ScrollProgress />
        <Nav />
        <Hero />
        <LogoTicker />
        <span {...{ [PREWARM_ATTR]: "services" }} aria-hidden="true" style={prewarmMarkerStyle} />
        <JourneyGate ready={!!active.services}><Services /></JourneyGate>
        <span {...{ [PREWARM_ATTR]: "products" }} aria-hidden="true" style={prewarmMarkerStyle} />
        <JourneyGate ready={!!active.products}><Featured /></JourneyGate>
        <JourneyGate ready={!!active.studio}><MoreProducts /></JourneyGate>
        <span {...{ [PREWARM_ATTR]: "agile" }} aria-hidden="true" style={prewarmMarkerStyle} />
        <JourneyGate ready={!!active.agile}><Agile /></JourneyGate>
        <About />
        <JourneyGate ready={!!active.contact}><Contact /></JourneyGate>
        <Footer />
      </div>
    </JourneyActivateProvider>
  );
}
