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
import { HomepageLoader } from "./homepageLoader/HomepageLoader";
import { useHomepageInitialReady } from "./homepageLoader/useHomepageInitialReady";
import { useVisualBudget } from "./visualBudget";
import { isMobileOrPortraitTablet, stableViewportHeight } from "./viewport";
import {
  loadAgileSection,
  loadFeaturedProductsSection,
  loadMoreProductsSection,
  loadServicesSection,
  PREWARM_ATTR,
  useHomepageSectionPrewarm,
} from "./homepagePrewarm";

const Services = dynamic(() => loadServicesSection().then((m) => m.Services));
const Featured = dynamic(() => loadFeaturedProductsSection().then((m) => m.Featured));
const MoreProducts = dynamic(() => loadMoreProductsSection().then((m) => m.MoreProducts));
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

const JOURNEY_SECTION_KEYS = ["services", "products", "studio", "agile", "contact"] as const;
type JourneySectionKey = (typeof JOURNEY_SECTION_KEYS)[number];

/* Constellation journey — now PER SECTION (no page-wide overlay). Each section
   mounts its own SectionConnector that draws its slice of the line behind that
   section's content (see SectionConnector.tsx). The journey reads:
     Hero ↘ Services(in L)  Products(in R)  Studio(in L)  Agile(in R, gap, exit low)
            ↘ About (pass-through, left lane)  ↘ Contact(in L).
   Each connector calls activate(key) when the line reaches that section's entry
   node, flipping its JourneyGate to ready so the section reveals once (and stays). */

export function SiteApp() {
  const visualBudget = useVisualBudget();
  const initialReady = useHomepageInitialReady();
  useOffscreenPause();
  useLayerChoreography();
  useSectionEntrance();
  useParallax();
  useHomepageSectionPrewarm(visualBudget);

  const [active, setActive] = React.useState<Record<string, boolean>>({});
  const activate = React.useCallback((k: string) => setActive((a) => (a[k] ? a : { ...a, [k]: true })), []);
  const earlyRevealRefs = React.useRef<Partial<Record<JourneySectionKey, HTMLElement>>>({});
  const setEarlyRevealRef = React.useCallback(
    (sectionKey: JourneySectionKey) => (node: HTMLElement | null) => {
      if (node) earlyRevealRefs.current[sectionKey] = node;
      else delete earlyRevealRefs.current[sectionKey];
    },
    [],
  );

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

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let observer: IntersectionObserver | undefined;
    let resizeTimer = 0;

    const teardown = () => {
      observer?.disconnect();
      observer = undefined;
    };

    const activatePassedTriggers = () => {
      const revealLine = stableViewportHeight() * 0.8;
      JOURNEY_SECTION_KEYS.forEach((sectionKey) => {
        const node = earlyRevealRefs.current[sectionKey];
        if (node && node.getBoundingClientRect().top <= revealLine) activate(sectionKey);
      });
    };

    const setup = () => {
      teardown();
      if (!isMobileOrPortraitTablet()) return;

      activatePassedTriggers();

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const sectionKey = (entry.target as HTMLElement).dataset.journeyReveal as
              | JourneySectionKey
              | undefined;
            if (sectionKey) activate(sectionKey);
            observer?.unobserve(entry.target);
          });
        },
        { threshold: 0, rootMargin: "0px 0px -20% 0px" },
      );

      JOURNEY_SECTION_KEYS.forEach((sectionKey) => {
        const node = earlyRevealRefs.current[sectionKey];
        if (node) observer?.observe(node);
      });
    };

    const scheduleSetup = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(setup, 120);
    };

    setup();
    window.addEventListener("resize", scheduleSetup);
    window.addEventListener("orientationchange", scheduleSetup);

    return () => {
      teardown();
      window.clearTimeout(resizeTimer);
      window.removeEventListener("resize", scheduleSetup);
      window.removeEventListener("orientationchange", scheduleSetup);
    };
  }, [activate]);

  return (
    <JourneyActivateProvider activate={activate}>
      <main className={s.site} data-visual-budget={visualBudget} aria-busy={!initialReady}>
        <HomeStarBackdrop visualBudget={visualBudget} />
        <ScrollProgress />
        <Nav />
        <Hero />
        <LogoTicker />
        <span ref={setEarlyRevealRef("services")} data-journey-reveal="services" {...{ [PREWARM_ATTR]: "services" }} aria-hidden="true" style={prewarmMarkerStyle} />
        <JourneyGate ready={!!active.services}><Services /></JourneyGate>
        <span ref={setEarlyRevealRef("products")} data-journey-reveal="products" {...{ [PREWARM_ATTR]: "products" }} aria-hidden="true" style={prewarmMarkerStyle} />
        <JourneyGate ready={!!active.products}><Featured /></JourneyGate>
        <span ref={setEarlyRevealRef("studio")} data-journey-reveal="studio" {...{ [PREWARM_ATTR]: "studio" }} aria-hidden="true" style={prewarmMarkerStyle} />
        <JourneyGate ready={!!active.studio}><MoreProducts /></JourneyGate>
        <span ref={setEarlyRevealRef("agile")} data-journey-reveal="agile" {...{ [PREWARM_ATTR]: "agile" }} aria-hidden="true" style={prewarmMarkerStyle} />
        <JourneyGate ready={!!active.agile}><Agile /></JourneyGate>
        <About />
        <span ref={setEarlyRevealRef("contact")} data-journey-reveal="contact" aria-hidden="true" style={prewarmMarkerStyle} />
        <JourneyGate ready={!!active.contact}><Contact /></JourneyGate>
        <Footer />
      </main>
      <HomepageLoader visible={!initialReady} />
    </JourneyActivateProvider>
  );
}
