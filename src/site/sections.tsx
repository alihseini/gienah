"use client";
import React from "react";
import { Button, Badge, Card, Icon } from "@/components";
import {
  Reveal, CountUp, SectionHead, AnimatedBG, ScrollParallax, siteStyles as s, go,
} from "./helpers";
import { LightPillar } from "./LightPillar";
import { ParticleField } from "./ParticleField";
import { TopologyField } from "./TopologyField";
import { BackgroundBeams } from "./BackgroundBeams";
import { StarField } from "./StarField";
import { LogoConstellation } from "./LogoConstellation";
import { HeroAtmosphere } from "./HeroAtmosphere";
import { Aurora } from "./Aurora";
import { Meteors } from "./Meteors";
import { HeadingReveal } from "./HeadingReveal";
import { TypingAnimation } from "./TypingAnimation";
import { Stagger, StaggerItem, FadeIn, Lift, Press } from "./motion";
import { GienahLight } from "./GienahLight";
import { ProductsBackdrop } from "./ProductsBackdrop";
import m from "./moreExplorer.module.css";
import ag from "./agileStage.module.css";
import productsData from "@/data/products.json";
import servicesData from "@/data/services.json";
import agileData from "@/data/agile.json";
import site from "@/data/site.json";
import type { Product, Service, AgileStage } from "@/data/types";

const PRODUCTS = productsData as Product[];
const FEATURED = PRODUCTS.filter((p) => p.featured);
const MORE = PRODUCTS.filter((p) => !p.featured);
const SERVICES = servicesData as Service[];
const AGILE = agileData as AgileStage[];

const reduceMotion = () =>
  typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------------- hero ---------------- */
export function Hero() {
  const atmoRef = React.useRef<HTMLDivElement>(null);
  const constRef = React.useRef<HTMLDivElement>(null);

  // very subtle pointer parallax on the background layers only (text stays still).
  // atmosphere drifts a little, the constellation a little more, for soft depth.
  React.useEffect(() => {
    if (reduceMotion()) return;
    if (window.matchMedia && !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    let x = 0, y = 0, tx = 0, ty = 0;
    const tick = () => {
      raf = 0;
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      const a = atmoRef.current, c = constRef.current;
      if (a) a.style.transform = `translate3d(${(-x * 10).toFixed(2)}px, ${(-y * 8).toFixed(2)}px, 0)`;
      if (c) c.style.transform = `translate3d(${(-x * 22).toFixed(2)}px, ${(-y * 16).toFixed(2)}px, 0)`;
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: MouseEvent) => {
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="top" className={s.page} style={{ overflow: "hidden", padding: "172px 0 110px" }}>
      {/* layered background, all behind content & with different scroll speeds for depth:
          atmosphere (slowest glow) → stars (medium) → main constellation (fastest).
          Each keeps its existing pointer-parallax / float; the wrappers only add the
          scroll-linked drift on top, so text & buttons stay perfectly still.
          The .heroBg wrapper masks the top so the starfield/constellation fades out
          of the navbar zone (never sits behind the floating nav). */}
      <div className={s.heroBg} aria-hidden="true">
        <ScrollParallax max={30}><HeroAtmosphere ref={atmoRef} /></ScrollParallax>
        <ScrollParallax max={48}><StarField /></ScrollParallax>
        <ScrollParallax max={64}>
          <div ref={constRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", willChange: "transform" }}>
            <LogoConstellation />
          </div>
        </ScrollParallax>
        {/* Gienah light signature: a subtle off-centre star tucked into a safe
            corner — never behind the headline/CTA; the hero star field stays the
            main identity */}
        <GienahLight pos="corner" tone="mixed" size="md" flare twinkle />
      </div>
      <div className={s.wrap} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <FadeIn y={12}>
          <div style={{ display: "inline-flex", marginBottom: 26 }}>
            <Badge variant="outline" className={s.darkBadgeOutline} leadingIcon={<Icon name="sparkles" size={13} />}>{site.hero.badge}</Badge>
          </div>
        </FadeIn>
        <HeadingReveal
          as="h1"
          style={{ fontSize: "clamp(40px, 7vw, 82px)", lineHeight: 1.02, fontWeight: 700, letterSpacing: "-0.04em", margin: "0 auto", maxWidth: 980, color: "#fff" }}
          segments={[{ text: site.hero.titleLead }, { text: site.hero.titleAccent, accent: true }]}
        />
        <FadeIn y={12} delay={0.12}>
          <TypingAnimation as="p" text={site.hero.sub} style={{ fontSize: 20, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 600, margin: "26px auto 0" }} />
        </FadeIn>
        <FadeIn y={14} delay={0.18}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 34, flexWrap: "wrap" }}>
            <Press><Button size="lg" variant="primary" className={s.btnGlow} onClick={() => go("contact")}>Start a project</Button></Press>
            <Press><Button size="lg" variant="secondary" trailingIcon={<Icon name="arrow-down" size={16} />} onClick={() => go("products")}>See our work</Button></Press>
          </div>
        </FadeIn>
        <Stagger style={{ display: "flex", justifyContent: "center", gap: "clamp(28px,6vw,72px)", marginTop: 64, flexWrap: "wrap" }} gap={0.1} delayChildren={0.28} amount={0.4}>
          {site.hero.stats.map(([n, l]) => (
            <StaggerItem key={l} y={14} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}><CountUp value={n} /></div>
              <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>{l}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------------- services ---------------- */
function ServicePanel({ s: svc, dim }: { s: Service; dim?: boolean }) {
  const gold = svc.tone === "gold";
  const glowA = gold ? "rgba(244,198,95,0.16)" : "rgba(88,171,206,0.16)";
  const glowB = gold ? "rgba(226,170,59,0.10)" : "rgba(42,146,204,0.12)";
  const accent = gold ? "var(--gold-400)" : "var(--accent-400)";
  return (
    <div className={s.svcSlide} style={{ height: "100%" }}>
      <div
        className={s.svcPanel}
        style={{
          height: "100%", boxSizing: "border-box",
          padding: "clamp(28px, 3.2vw, 46px)",
          borderRadius: 26,
          background: `radial-gradient(900px 360px at 100% -10%, ${glowA}, transparent 62%), radial-gradient(700px 320px at -8% 120%, ${glowB}, transparent 62%), rgb(15,23,40)`,
          backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow: "0 40px 90px -40px rgba(2,10,22,0.9), 0 1px 0 rgba(255,255,255,0.06) inset",
          display: "grid", gap: "clamp(28px, 4vw, 64px)", alignItems: "center",
        }}
      >
        <span className={s.svcRing} aria-hidden="true" style={{ opacity: dim ? 0.35 : 1 }}><i /></span>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <span className={s.floatIcon} style={{ width: 64, height: 64, borderRadius: 18, background: "var(--brand-gradient-soft)", color: gold ? "var(--gold-700)" : "var(--accent-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", boxShadow: `0 10px 30px -10px ${glowA}` }}><Icon name={svc.icon} size={30} /></span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: accent, letterSpacing: "0.04em" }}>SERVICE {svc.no}</span>
          </div>
          <h3 style={{ fontSize: "clamp(34px, 4.4vw, 54px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 18px", color: "#fff", lineHeight: 1.04 }}>{svc.title}</h3>
          <p style={{ fontSize: "clamp(16px, 1.4vw, 19px)", lineHeight: 1.65, color: "var(--ink-text-dim)", margin: "0 0 24px", maxWidth: 440 }}>{svc.desc}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {svc.tags.map((tg) => (
              <span key={tg} style={{ fontSize: 13, fontWeight: 500, color: "#fff", padding: "7px 14px", borderRadius: 99, background: "rgba(255,255,255,0.07)", border: `1px solid ${gold ? "rgba(244,198,95,0.34)" : "rgba(88,171,206,0.34)"}` }}>{tg}</span>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-text-dim)", marginBottom: 16 }}>Capabilities</div>
          <div className={s.respGrid2} style={{ gap: "12px 22px" }}>
            {svc.caps.map((c) => (
              <div key={c} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: "clamp(13.5px, 1.05vw, 15px)", color: "rgba(232,234,238,0.92)", lineHeight: 1.4 }}>
                <span style={{ color: accent, marginTop: 2, flex: "none" }}><Icon name="check" size={15} /></span>{c}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* stepped sticky stage — previous cards recede into a visible stacked deck behind the active one */
function ServiceSlide({ s: svc, d }: { s: Service; d: number }) {
  const cur = d === 0;
  const past = d < 0;
  const depth = Math.min(-d, 3);
  let transform: string, opacity: number | string, filter: string, zIndex: number;
  if (cur) {
    transform = "translate3d(0,0,0) scale(1)";
    opacity = 1; filter = "none"; zIndex = 30;
  } else if (past) {
    // recede travel is capped (≈42px max) so the top of a deep card never crosses
    // the ~64px gap up into the section description above the deck
    transform = `translate3d(0, ${(-depth * 14).toFixed(1)}px, 0) scale(${(1 - depth * 0.05).toFixed(3)})`;
    opacity = Math.max(0.28, 1 - depth * 0.26).toFixed(3);
    filter = `brightness(${Math.max(0.55, 1 - depth * 0.16).toFixed(2)})`;
    zIndex = 30 - depth;
  } else {
    // incoming card: rise + fade only (no scale) so it doesn't grow as it becomes active
    transform = "translate3d(0, 64px, 0)";
    opacity = 0; filter = "blur(5px)"; zIndex = 1;
  }
  return (
    <div
      aria-hidden={!cur}
      style={{
        position: "absolute", inset: 0,
        transform, opacity, filter, zIndex,
        pointerEvents: cur ? "auto" : "none",
        transformOrigin: "center top",
        transition: "transform .66s cubic-bezier(.22,1,.36,1), opacity .5s var(--ease-out), filter .5s var(--ease-out)",
        willChange: "transform, opacity",
      }}
    >
      <ServicePanel s={svc} dim={past} />
    </div>
  );
}

/* Mobile/tablet services carousel — equal-height cards, scroll-snap, coverflow
   active state + staggered entrance. Own component so the hooks stay mobile-only. */
function ServicesCarousel({ header }: { header: React.ReactNode }) {
  const railRef = React.useRef<HTMLDivElement>(null);
  const active = useActiveCard(railRef, SERVICES.length);
  return (
    <section id="services" className={s.panel} style={{ background: "var(--page-bg)", overflow: "clip", position: "relative", zIndex: 2, padding: "96px 0 84px" }}>
      <Aurora />
      <Meteors />
      <GienahLight pos="top" tone="blue" size="md" flare={false} />
      <div className={s.wrap} style={{ position: "relative", zIndex: 1 }}>
        {header}
        <FadeIn y={22} amount={0.18}>
          <div className={[s.pcarousel, s.scarousel].join(" ")} ref={railRef}>
            {SERVICES.map((svc, i) => (
              <div className={s.scard} key={svc.title} data-active={i === active ? "" : undefined}><ServicePanel s={svc} /></div>
            ))}
          </div>
          <div className={[s.pcardHint, s.pcardHintLive].join(" ")} aria-hidden="true"><Icon name="arrow-left" size={13} /> swipe through services <Icon name="arrow-right" size={13} /></div>
        </FadeIn>
      </div>
    </section>
  );
}

export function Services() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const idxRef = React.useRef(0);
  const [active, setActive] = React.useState(0);
  // reduced-motion is detected AFTER mount so the server and the first client
  // render agree (both render the sticky version) — reading it synchronously in
  // useState made the reduced client hydrate a different tree than the SSR'd one
  // (hydration mismatch / React #418).
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => { setReduce(reduceMotion()); }, []);
  // mobile/tablet (<=1024) renders a native swipe carousel; desktop keeps the
  // scroll-stepped deck. Detected after mount so SSR + first paint agree.
  const [carousel, setCarousel] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const apply = () => setCarousel(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const N = SERVICES.length;
  React.useEffect(() => {
    if (reduce || carousel) return;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = trackRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const dist = el.offsetHeight - vh;
      const scrolled = clamp(-r.top, 0, dist);
      const raw = dist > 0 ? clamp(scrolled / (dist * 0.9), 0, 1) : 0;
      const ni = clamp(Math.floor(raw * N), 0, N - 1);
      if (ni !== idxRef.current) { idxRef.current = ni; setActive(ni); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduce, N, carousel]);

  const Header = (
    <SectionHead tag="#Services" light title="Everything from idea to launch" sub="Four disciplines, one team — so your product stays coherent from the first conversation to its first users." />
  );

  // ---- mobile / tablet: native swipe carousel through the service cards ----
  if (carousel) {
    return <ServicesCarousel header={Header} />;
  }

  if (reduce) {
    return (
      <section id="services" className={s.panel} style={{ background: "var(--page-bg)", overflow: "hidden", padding: "120px 0 96px", position: "relative", zIndex: 2 }}>
        <Aurora />
        <Meteors />
        <GienahLight pos="top" tone="blue" size="md" flare={false} />
        <div className={s.wrap} style={{ position: "relative", zIndex: 1 }}>
          {Header}
          <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
            {SERVICES.map((svc) => <div key={svc.title} style={{ minHeight: 320, position: "relative" }}><ServicePanel s={svc} /></div>)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className={s.panel} style={{ background: "var(--page-bg)", overflow: "clip", position: "relative", zIndex: 2 }}>
      <div ref={trackRef} style={{ position: "relative", zIndex: 1, height: `${N * 88}vh` }}>
        {/* `safe center`: stays visually centered when the content fits, but if the
            content is ever taller than the viewport it aligns to the top (clearing
            the fixed navbar via the 100px top padding) instead of overflowing
            upward under the navbar. Prevents the navbar/heading overlap. */}
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "safe center", padding: "100px 0 52px", boxSizing: "border-box", overflow: "hidden", background: "radial-gradient(70% 60% at 80% 12%, rgba(88,171,206,0.22), rgba(244,198,95,0.11) 36%, transparent 64%), radial-gradient(60% 64% at 12% 90%, rgba(42,146,204,0.16), transparent 62%), var(--page-bg)" }}>
          <Aurora />
          <Meteors />
          {/* Gienah star accent above the title + a soft halo wash over the deck */}
          <GienahLight pos="top" tone="blue" size="md" flare={false} />
          <div className={s.wrap} style={{ width: "100%", position: "relative", zIndex: 1 }}>
            {Header}
            <div style={{ position: "relative", height: "clamp(420px, 56vh, 520px)", marginTop: 8 }}>
              {SERVICES.map((svc, i) => <ServiceSlide key={svc.title} s={svc} d={i - active} />)}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 9, marginTop: 22 }}>
              {SERVICES.map((svc, i) => (
                <span key={svc.title} aria-hidden="true" style={{ width: i === active ? 26 : 8, height: 8, borderRadius: 99, background: i === active ? "var(--brand-gradient)" : "rgba(255,255,255,0.22)", transition: "width .4s var(--ease-out), background .4s var(--ease-out)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- products ---------------- */
function PhoneFrame({ p }: { p: Product }) {
  const tone = p.tone;
  const bg = tone === "gold"
    ? "linear-gradient(160deg, #fdf6e6, #f4d485 55%, #e2aa3b)"
    : "linear-gradient(160deg, #ecf6fc, #a7d8f1 55%, #2a92cc)";
  const fg = tone === "gold" ? "var(--gold-800)" : "var(--accent-800)";
  const shot = p.shots[0];
  return (
    <div className={s.device}>
      <div className={s.deviceScreen} style={{ background: bg, padding: shot ? 0 : undefined }}>
        {shot ? (
          <img src={shot} alt={p.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <>
            <img src="/assets/logo-mark.png" alt="" style={{ height: 44, width: "auto", opacity: 0.92 }} />
            <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: fg }}>{p.title}</div>
            <div className={s.deviceTag} style={{ color: fg, opacity: 0.7 }}>App preview</div>
          </>
        )}
      </div>
    </div>
  );
}

function ProductSlide({ p, d }: { p: Product; d: number }) {
  const cur = d === 0;
  const style: React.CSSProperties = {
    position: "absolute", inset: 0, display: "flex", alignItems: "center",
    gap: "clamp(28px, 5vw, 80px)",
    // slide + fade only — no scale, so a product never grows/pops as it becomes active
    transform: cur ? "translate3d(0,0,0)" : `translate3d(${d > 0 ? 96 : -72}px,0,0)`,
    opacity: cur ? 1 : 0,
    filter: cur ? "none" : "blur(6px)",
    pointerEvents: cur ? "auto" : "none",
    zIndex: cur ? 2 : 1,
    transition: "transform .62s cubic-bezier(.22,1,.36,1), opacity .5s var(--ease-out), filter .5s var(--ease-out)",
    willChange: "transform, opacity",
  };
  return (
    <div style={style} aria-hidden={!cur} className={s.featrow}>
      <div style={{ flex: "none", display: "flex", justifyContent: "center" }}><PhoneFrame p={p} /></div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <Badge variant={p.tone === "gold" ? "warning" : "accent"} className={p.tone === "gold" ? s.darkBadgeWarning : s.darkBadgeAccent}>{p.category}</Badge>
          <Badge variant="neutral" className={s.darkBadgeNeutral}>{p.year}</Badge>
        </div>
        <h3 style={{ fontSize: "clamp(30px, 4vw, 42px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 16px" }}>{p.title}</h3>
        <p style={{ fontSize: 17, lineHeight: 1.65, color: "var(--text-secondary)", margin: "0 0 18px", maxWidth: 540 }}>{p.blurb}</p>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-tertiary)", marginBottom: 22 }}>{p.tech}</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {p.website && <Button variant="primary" className={s.btnGlow} as="a" href={p.website} target="_blank" rel="noopener" trailingIcon={<Icon name="external-link" size={15} />}>Website</Button>}
          {p.download && <Button variant="secondary" as="a" href={p.download} target="_blank" rel="noopener" leadingIcon={<Icon name="download" size={15} />}>Download</Button>}
          <Button variant={p.website ? "ghost" : "primary"} className={p.website ? "" : s.btnGlow} as="a" href={`/projects/${p.id}`} trailingIcon={<Icon name="arrow-right" size={15} />}>Case study</Button>
        </div>
      </div>
    </div>
  );
}

/* Tracks which carousel cell is centered in the scroller, so the active card can
   be emphasised (coverflow) while neighbours recede. rAF-throttled, passive. The
   carousel gets data-enhanced so the dim/scale styling only applies once JS runs
   (no-JS / SSR shows every card at full prominence). */
function useActiveCard(ref: React.RefObject<HTMLDivElement | null>, count: number) {
  const [active, setActive] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.dataset.enhanced = "";
    let raf = 0;
    const update = () => {
      raf = 0;
      const center = el.scrollLeft + el.clientWidth / 2;
      const cards = Array.from(el.children) as HTMLElement[];
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => {
        const cc = c.offsetLeft + c.offsetWidth / 2;
        const d = Math.abs(cc - center);
        if (d < bestD) { bestD = d; best = i; }
      });
      setActive(best);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    el.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => { el.removeEventListener("scroll", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [ref, count]);
  return active;
}

/* Mobile/tablet product card — full, readable content in a swipe-carousel cell
   (no absolute positioning, natural height; reuses the same product data). */
function ProductCard({ p, active }: { p: Product; active?: boolean }) {
  return (
    <div className={s.pcard} data-active={active ? "" : undefined}>
      <PhoneFrame p={p} />
      <div className={s.pcardText}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
          <Badge variant={p.tone === "gold" ? "warning" : "accent"} className={p.tone === "gold" ? s.darkBadgeWarning : s.darkBadgeAccent}>{p.category}</Badge>
          <Badge variant="neutral" className={s.darkBadgeNeutral}>{p.year}</Badge>
        </div>
        <h3 style={{ fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 12px" }}>{p.title}</h3>
        <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "var(--text-secondary)", margin: "0 0 14px" }}>{p.blurb}</p>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-tertiary)", marginBottom: 18 }}>{p.tech}</div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {p.website && <Button variant="primary" size="sm" className={s.btnGlow} as="a" href={p.website} target="_blank" rel="noopener" trailingIcon={<Icon name="external-link" size={14} />}>Website</Button>}
          {p.download && <Button variant="secondary" size="sm" as="a" href={p.download} target="_blank" rel="noopener" leadingIcon={<Icon name="download" size={14} />}>Download</Button>}
          <Button variant={p.website ? "ghost" : "primary"} size="sm" className={p.website ? "" : s.btnGlow} as="a" href={`/projects/${p.id}`} trailingIcon={<Icon name="arrow-right" size={14} />}>Case study</Button>
        </div>
      </div>
    </div>
  );
}

/* Mobile/tablet products carousel — scroll-snap + a coverflow active state and a
   staggered entrance. Split into its own component so the hooks only run on the
   mobile branch. */
function FeaturedCarousel() {
  const railRef = React.useRef<HTMLDivElement>(null);
  const active = useActiveCard(railRef, FEATURED.length);
  return (
    <section id="products" className={[s.panel, s.overlap].join(" ")} style={{ background: "var(--page-bg)", position: "relative", overflow: "clip", zIndex: 3 }}>
      <div style={{ position: "relative", overflow: "hidden", padding: "78px 0 60px", background: "var(--page-bg)" }}>
        {/* same background system as desktop, just non-sticky */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5 }}>
          <LightPillar topColor="#2A92CC" bottomColor="#F4C65F" intensity={0.45} rotationSpeed={0.3} glowAmount={0.002} pillarWidth={3} pillarHeight={0.4} noiseIntensity={0.5} pillarRotation={25} interactive={false} mixBlendMode="screen" quality="high" />
        </div>
        <ProductsBackdrop />
        <div className={s.wrap} style={{ position: "relative", zIndex: 1 }}>
          <SectionHead tag="#Products" title="Work we're proud of" sub="A few of the products we've designed and engineered end to end." />
          <FadeIn y={22} amount={0.18}>
            <div className={s.pcarousel} ref={railRef}>
              {FEATURED.map((p, i) => <ProductCard key={p.id} p={p} active={i === active} />)}
            </div>
            <div className={[s.pcardHint, s.pcardHintLive].join(" ")} aria-hidden="true"><Icon name="arrow-left" size={13} /> swipe to explore <Icon name="arrow-right" size={13} /></div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}

export function Featured() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const idxRef = React.useRef(0);
  const [active, setActive] = React.useState(0);
  // mobile/tablet (<=1024) renders a native swipe carousel; desktop keeps the
  // sticky deck. Detected AFTER mount (SSR + first paint render the deck) so the
  // server and client agree — no hydration mismatch.
  const [carousel, setCarousel] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1024px)");
    const apply = () => setCarousel(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  const N = FEATURED.length;
  React.useEffect(() => {
    if (carousel) return; // desktop-only scroll deck — no scroll listener on mobile/tablet
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = trackRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const dist = el.offsetHeight - vh;
      const scrolled = clamp(-r.top, 0, dist);
      const raw = dist > 0 ? clamp(scrolled / (dist * 0.88), 0, 1) : 0;
      const ni = clamp(Math.floor(raw * N), 0, N - 1);
      if (ni !== idxRef.current) { idxRef.current = ni; setActive(ni); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [N, carousel]);

  // ---- mobile / tablet: native swipe carousel (scroll-snap + coverflow) ----
  if (carousel) {
    return <FeaturedCarousel />;
  }

  return (
    <section id="products" className={[s.panel, s.overlap].join(" ")} style={{ background: "var(--page-bg)", position: "relative", overflow: "clip", zIndex: 3 }}>
      <div ref={trackRef} style={{ position: "relative", zIndex: 1, height: `${N * 88}vh` }}>
        {/* safe center — see Services: never lets tall content overflow up under
            the fixed navbar (top padding 92px clears it). */}
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "safe center", paddingTop: 92, paddingBottom: 44, boxSizing: "border-box", overflow: "hidden", background: "var(--page-bg)" }}>
          {/* Three.js LightPillar kept, but dimmed to a subtle distant accent so
              the new cosmic-glass backdrop and the products stay dominant */}
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.5 }}>
            <LightPillar topColor="#2A92CC" bottomColor="#F4C65F" intensity={0.45} rotationSpeed={0.3} glowAmount={0.002} pillarWidth={3} pillarHeight={0.4} noiseIntensity={0.5} pillarRotation={25} interactive={false} mixBlendMode="screen" quality="high" />
          </div>
          {/* restrained Cosmic Glass / Aurora backdrop — corner aurora, faint
              stars, off-centre rim-light, cinematic vignette (no star behind the
              product/text) */}
          <ProductsBackdrop />
          <div className={s.wrap} style={{ width: "100%", position: "relative", zIndex: 1 }}>
            <SectionHead tag="#Products" title="Work we're proud of" sub="A few of the products we've designed and engineered end to end." />
            <div className={s.featDeck} style={{ position: "relative", marginTop: 6 }}>
              {FEATURED.map((p, i) => <ProductSlide key={p.id} p={p} d={i - active} />)}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 9, marginTop: 14 }}>
              {FEATURED.map((p, i) => (
                <span key={p.id} aria-hidden="true" style={{ width: i === active ? 26 : 8, height: 8, borderRadius: 99, background: i === active ? "var(--brand-gradient)" : "rgba(255,255,255,0.22)", transition: "width .4s var(--ease-out), background .4s var(--ease-out)" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* One full visual layer (media + optional content) of the preview card. Only the
   topmost (incoming) layer renders the body, so text never overlaps during the
   crossfade. */
function PreviewLayer({ p, body, incoming }: { p: Product; body: boolean; incoming: boolean }) {
  const media = p.banner || p.shots[0] || null;
  const toneBg = p.tone === "gold" ? "linear-gradient(150deg, #f4d485, #e2aa3b 70%, #c68d28)" : "linear-gradient(150deg, #a7d8f1, #2a92cc 70%, #1f7cae)";
  const tags = p.tech.split("·").map((x) => x.trim()).filter(Boolean).slice(0, 4);
  return (
    <div className={[m.layer, incoming ? m.layerIn : ""].filter(Boolean).join(" ")}>
      <div className={m.media}>
        {media ? (
          <img src={media} alt={p.title} />
        ) : (
          <div className={m.placeholder} style={{ background: toneBg }}>
            <img src="/assets/logo-mark.png" alt="" style={{ height: 56, width: "auto", opacity: 0.92 }} />
          </div>
        )}
      </div>
      <div className={m.overlayDark} />
      <div className={m.glow} />
      {body && (
        <div className={[m.body, incoming ? m.stagger : ""].filter(Boolean).join(" ")}>
          <div className={m.badges}>
            <Badge variant={p.tone === "gold" ? "warning" : "accent"} className={p.tone === "gold" ? s.darkBadgeWarning : s.darkBadgeAccent}>{p.category}</Badge>
            <Badge variant="neutral" className={s.darkBadgeNeutral}>{p.year}</Badge>
          </div>
          <div className={m.pTitle}>{p.title}</div>
          <div className={m.pDesc}>{p.blurb}</div>
          <div className={m.tags}>
            {tags.map((t) => <span key={t} className={m.tag}>{t}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

/* Crossfading preview: keeps at most the previous + current project mounted so
   the outgoing media fades out beneath the incoming one. Card size is fixed via
   aspect-ratio, so there's no layout jump. */
function MorePreview({ p }: { p: Product }) {
  type L = { p: Product; key: number };
  const keyRef = React.useRef(0);
  const [layers, setLayers] = React.useState<L[]>([{ p, key: 0 }]);
  React.useEffect(() => {
    setLayers((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.p.id === p.id) return prev;
      keyRef.current += 1;
      // keep only the outgoing (last) layer + the new incoming one
      return [...prev.slice(-1), { p, key: keyRef.current }];
    });
    const t = setTimeout(() => setLayers((prev) => prev.slice(-1)), 560);
    return () => clearTimeout(t);
  }, [p]);
  return (
    <a href={`/projects/${p.id}`} className={m.preview} data-parallax="28">
      {layers.map((l, i) => (
        <PreviewLayer key={l.key} p={l.p} body={i === layers.length - 1} incoming={i === layers.length - 1 && layers.length > 1} />
      ))}
    </a>
  );
}

export function MoreProducts() {
  const [active, setActive] = React.useState(MORE[0].id);
  const cur = MORE.find((p) => p.id === active) || MORE[0];
  // on touch (<=920) the hover-preview pane is dropped in favour of self-contained
  // tappable rows (each carries its own thumbnail) — detected after mount.
  const [touch, setTouch] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 920px)");
    const apply = () => setTouch(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return (
    <section className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" style={{ background: "var(--page-bg)", overflow: "hidden", padding: "120px 0 96px", zIndex: 4 }}>
      {/* layer 0: dark base (section bg) → topology network field */}
      <div className={m.topo}><TopologyField /></div>
      {/* layer 1: readability mask / vignette */}
      <div className={m.mask} />
      {/* background blobs drift slower than the content for soft parallax depth */}
      <ScrollParallax max={62} style={{ opacity: 0.28, zIndex: 0 }}><AnimatedBG variant="blobs" /></ScrollParallax>
      {/* soft Gienah glow washing in from the left (no flare — a calm wash) */}
      <GienahLight pos="left" tone="blue" size="md" flare={false} />
      {/* layer 2: content */}
      <div className={[s.wrap, s.layer].join(" ")} data-layer="front" style={{ position: "relative", zIndex: 2 }}>
        <HeadingReveal as="div" className={s.eyebrow} style={{ textAlign: "center", marginBottom: 8 }} segments={[{ text: "More from the studio" }]} />
        <Reveal delay={60}><TypingAnimation as="p" text={touch ? "Tap a project to open its case study." : "Hover a project to preview it — click to open the case study."} style={{ textAlign: "center", fontSize: 16, color: "var(--text-secondary)", margin: "0 0 8px" }} /></Reveal>
        <div className={m.explorer}>
          <div className={m.list} onMouseLeave={() => setActive(MORE[0].id)}>
            {MORE.map((p, i) => (
              <a
                key={p.id}
                href={`/projects/${p.id}`}
                className={[m.row, p.id === active ? m.rowActive : ""].filter(Boolean).join(" ")}
                data-parallax={String(10 + (i % 3) * 7)}
                onMouseEnter={() => setActive(p.id)}
                onFocus={() => setActive(p.id)}
                onTouchStart={() => setActive(p.id)}
              >
                <span
                  className={m.rowThumb}
                  aria-hidden="true"
                  style={(p.banner || p.shots[0]) ? { backgroundImage: `url(${p.banner || p.shots[0]})` } : undefined}
                />
                <div className={m.rowLeft}>
                  <span className={m.num}>#{p.id}</span>
                  <span className={m.title}>{p.title}</span>
                </div>
                <span className={m.arrow}><Icon name="arrow-up-right" size={22} /></span>
              </a>
            ))}
          </div>
          <Reveal variant="right" className={m.previewWrap}>
            <MorePreview p={cur} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- agile ---------------- */
function AgilePanel({ st, i }: { st: AgileStage; i: number }) {
  const gold = i % 2 === 1;
  const accent = gold ? "var(--gold-400)" : "var(--accent-400)";
  const rgb = gold ? "244,198,95" : "88,171,206";
  return (
    <div className={ag.panel}>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className={ag.iconChip} style={{ color: accent }}><Icon name={st.icon} size={26} /></span>
          <span className={ag.num} style={{ color: accent }}>0{i + 1}</span>
        </div>
        <div className={ag.name}>{st.name}</div>
        <div>
          {st.items.map((it) => (
            <div key={it} className={ag.item}><span className={ag.dot} style={{ background: accent }} />{it}</div>
          ))}
        </div>
      </div>
      <div className={ag.illus}>
        <div className={ag.illusGlow} data-parallax="30" style={{ background: `radial-gradient(circle at 60% 42%, rgba(${rgb},0.28), transparent 65%)` }} />
        <div className={ag.illusIcon} data-parallax="46" style={{ color: `rgba(${rgb},0.5)` }}><Icon name={st.icon} size={132} /></div>
        <span className={[ag.streak, gold ? "" : ag.streakBlue].join(" ")} style={{ top: "22%", ["--sd" as string]: "7s" } as React.CSSProperties} />
        <span className={ag.streak} style={{ top: "50%", ["--sd" as string]: "9s", animationDelay: "-2s" } as React.CSSProperties} />
        <span className={[ag.streak, gold ? "" : ag.streakBlue].join(" ")} style={{ top: "76%", ["--sd" as string]: "8s", animationDelay: "-4s" } as React.CSSProperties} />
      </div>
    </div>
  );
}

export function Agile() {
  const timelineRef = React.useRef<HTMLDivElement>(null);
  // curved connector path through every card's node, measured from layout (so the
  // cards' reveal transforms never shift the anchors). Recomputed on resize.
  const [conn, setConn] = React.useState<{ d: string; w: number; h: number } | null>(null);

  // reveal each card when it nears the viewport (runs once; stays revealed on scroll-up)
  React.useEffect(() => {
    const root = timelineRef.current;
    if (!root) return;
    const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-slot]"));
    if (reduceMotion()) {
      slots.forEach((el) => (el.dataset.shown = ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).dataset.shown = ""; io.unobserve(e.target); } }),
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );
    slots.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.85 && r.bottom > 0) el.dataset.shown = "";
      else io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // build the smooth S-curve that links node → node down the alternating timeline
  React.useEffect(() => {
    const root = timelineRef.current;
    if (!root) return;
    const build = () => {
      const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-slot]"));
      if (slots.length < 2) { setConn(null); return; }
      const w = root.clientWidth, h = root.clientHeight;
      // anchor = each card's node center, derived from layout offsets (transform-free).
      // right card (i even): node on its inner/left edge; left card: inner/right edge.
      const pts = slots.map((slot, i) => {
        const right = i % 2 === 0;
        const x = right ? slot.offsetLeft : slot.offsetLeft + slot.offsetWidth;
        const y = slot.offsetTop + slot.offsetHeight / 2;
        return { x, y };
      });
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const my = (a.y + b.y) / 2; // control points at the vertical midpoint → soft S-curve
        d += ` C ${a.x.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      setConn({ d, w, h });
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(root);
    window.addEventListener("resize", build);
    const t = setTimeout(build, 400); // re-measure after fonts/layout settle
    return () => { ro.disconnect(); window.removeEventListener("resize", build); clearTimeout(t); };
  }, []);

  // draw the curved path with scroll progress (sets --p on the timeline; the SVG
  // draw-path reads it via stroke-dashoffset). Reduced motion → fully drawn.
  React.useEffect(() => {
    const root = timelineRef.current;
    if (!root) return;
    if (reduceMotion()) { root.style.setProperty("--p", "1"); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / (r.height || 1)));
      root.style.setProperty("--p", String(p));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="agile" className={[s.panel, s.overlap].join(" ")} style={{ background: "var(--page-bg)", color: "var(--ink-text)", overflow: "hidden", padding: "120px 0", position: "relative", zIndex: 5 }}>
      {/* Hero-style atmosphere: subtle star field + a very soft brand glow (no logo
          constellation, no fog/topology/meteors/aurora) — keeps Agile visually
          connected to the Hero but simpler. Both sit behind the content (z-index 1). */}
      <ScrollParallax max={48}><StarField /></ScrollParallax>
      <ScrollParallax max={56}><div className={ag.beam} aria-hidden="true" /></ScrollParallax>
      {/* subtle Gienah star above the title — the connector/line system below is
          untouched */}
      <GienahLight pos="top" tone="mixed" size="md" flare={false} />
      <div className={s.wrap} style={{ position: "relative", zIndex: 1 }}>
        <SectionHead tag="#AGILE_METHODOLOGY" light title="How we ship — calmly, every sprint" sub="A predictable rhythm from first conversation to production. Hover any stage to see what happens inside it." />
        <div className={ag.timeline} ref={timelineRef}>
          {/* mobile-only vertical rail: a single drawn line down the left, filled
              with the same --p scroll progress that draws the desktop curve */}
          <span className={ag.rail} aria-hidden="true"><span className={ag.railFill} /></span>
          {conn && (
            <svg className={ag.connSvg} width={conn.w} height={conn.h} viewBox={`0 0 ${conn.w} ${conn.h}`} fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="agileConnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#58ABCE" />
                  <stop offset="0.4" stopColor="#2A92CC" />
                  <stop offset="0.72" stopColor="#F4C65F" />
                  <stop offset="1" stopColor="#E2AA3B" />
                </linearGradient>
              </defs>
              {/* faint dotted full path — the "track" */}
              <path className={ag.connBase} d={conn.d} />
              {/* glowing path drawn with scroll progress */}
              <path className={ag.connDraw} d={conn.d} pathLength={1} stroke="url(#agileConnGrad)" />
            </svg>
          )}
          {AGILE.map((st, i) => {
            const right = i % 2 === 0; // 01 right, 02 left, 03 right, …
            return (
              <div key={st.name} data-slot className={[ag.slot, right ? ag.right : ag.left].join(" ")}>
                <span className={ag.connector} aria-hidden="true" />
                <AgilePanel st={st} i={i} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ---------------- about ---------------- */
export function About() {
  return (
    <section id="about" className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" style={{ background: "var(--page-bg)", overflow: "hidden", padding: "120px 0", zIndex: 6 }}>
      <ScrollParallax max={52}><BackgroundBeams /></ScrollParallax>
      {/* soft diagonal Gienah glow (calm wash, no flare) */}
      <GienahLight pos="diagonal" tone="blue" size="md" flare={false} />
      <div className={[s.wrap, s.layer, s.respGrid2].join(" ")} data-layer="front" style={{ position: "relative", zIndex: 1, gap: "clamp(32px,6vw,80px)", alignItems: "center" }}>
        <div>
          <Reveal><div className={s.eyebrow}>#ABOUT_US</div></Reveal>
          <HeadingReveal as="h2" style={{ fontSize: "clamp(30px,4vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "14px 0 0", lineHeight: 1.1 }} segments={[{ text: "A studio built to take products" }, { text: "all the way.", accent: true }]} />
          {site.about.paragraphs.map((para, i) => {
            // cascade: each paragraph begins typing once the previous one finishes
            const startDelay = 130 + site.about.paragraphs.slice(0, i).reduce((sum, p) => sum + p.length * 22 + 280, 0);
            return (
              <Reveal key={i} delay={130 + i * 60}><TypingAnimation as="p" text={para} speed={22} startDelay={startDelay} style={{ fontSize: 17, lineHeight: 1.7, color: "var(--text-secondary)", marginTop: i ? 14 : 18 }} /></Reveal>
            );
          })}
          <Reveal delay={250}><div style={{ marginTop: 26 }}><Button variant="primary" className={s.btnGlow} onClick={() => go("contact")}>Start a project</Button></div></Reveal>
        </div>
        <Stagger style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} gap={0.1} amount={0.3}>
          {site.about.stats.map(([ic, t, d], i) => (
            <Lift asItem key={t} y={20} style={{ marginTop: i % 2 ? 24 : 0 }}>
              <Card padding={20} className={[s.glassCard, s.cardHoverGlow].join(" ")}>
                <span style={{ color: "var(--accent-600)" }}><Icon name={ic} size={22} /></span>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 12 }}>{t}</div>
                <div style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>{d}</div>
              </Card>
            </Lift>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------------- contact ---------------- */
export function Contact() {
  const ref = React.useRef<HTMLDivElement>(null);
  const bgRef = React.useRef<HTMLDivElement>(null);
  const progRef = React.useRef(0);
  React.useEffect(() => {
    const el = ref.current; if (!el) return;
    if (reduceMotion()) { progRef.current = 1; return; }
    let raf = 0;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const apply = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const total = r.height + vh;
      const p = clamp((vh - r.top) / total, 0, 1);
      const e = p * p * (3 - 2 * p);
      progRef.current = e;
      // content RISES only (translateY) — no scroll scale on text/cards (the inner
      // Reveals + the section's own entrance already handle scale; stacking another
      // scroll-linked scale here made the content pop larger as it revealed).
      const ty = ((0.62 - e) * 34).toFixed(1);
      el.style.transform = `translate3d(0, ${ty}px, 0)`;
      const bg = bgRef.current;
      // background lights drift slower than the content + breathe in scale (decorative depth)
      if (bg) bg.style.transform = `translate3d(0, ${((0.5 - e) * 46).toFixed(1)}px, 0) scale(${(1 + e * 0.1).toFixed(4)})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(apply); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    apply();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);
  const [sent, setSent] = React.useState(false);
  return (
    <section id="contact" className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" style={{ background: "var(--page-bg)", overflow: "hidden", padding: "120px 0", zIndex: 7 }}>
      {/* overscan (inset:-90) so the scroll translate/scale can never expose a bare
          strip — the layer always covers the section; the section clips the excess. */}
      <div ref={bgRef} style={{ position: "absolute", inset: -90, willChange: "opacity, filter, transform", transition: "opacity .2s linear" }}>
        <AnimatedBG variant="glow" />
      </div>
      <ParticleField progressRef={progRef} />
      {/* final Gienah signature: the strongest, premium glow rising from BELOW
          the form/CTA (not behind the text), with a subtle settled twinkle */}
      <GienahLight pos="bottom" tone="mixed" size="lg" flare={false} twinkle strong />
      <div ref={ref} className={s.wrap} style={{ maxWidth: 1000, position: "relative", zIndex: 1, transformOrigin: "center center", willChange: "transform" }}>
        <div className={s.respGrid2} style={{ gap: "clamp(32px,6vw,72px)", alignItems: "start" }}>
          <div>
            <Reveal><div className={s.eyebrow}>#CONTACT_US</div></Reveal>
            <HeadingReveal as="h2" style={{ fontSize: "clamp(32px,4.4vw,52px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "14px 0 0", lineHeight: 1.05 }} segments={[{ text: "Hey." }, { br: true }, { text: "Let's talk.", accent: true }]} />
            <Reveal delay={130}><TypingAnimation as="p" text="Tell us about your idea, your timeline, or just say hi. We reply to every message." style={{ fontSize: 17, lineHeight: 1.65, color: "var(--text-secondary)", marginTop: 18, maxWidth: 380 }} /></Reveal>
            <Reveal delay={190}>
              <Press style={{ marginTop: 24 }}>
                <a href={`mailto:${site.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 600, color: "var(--text-accent)" }}>
                  <Icon name="mail" size={20} /> {site.email}
                </a>
              </Press>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <Card padding={26} className={[s.glassCard, s.cardHoverGlow].join(" ")} style={{ boxShadow: "var(--shadow-lg)" }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: "30px 10px" }}>
                  <span style={{ color: "var(--green-600)" }}><Icon name="circle-check" size={40} /></span>
                  <div style={{ fontSize: 20, fontWeight: 600, marginTop: 14 }}>Message sent</div>
                  <p style={{ fontSize: 14.5, color: "var(--text-secondary)", marginTop: 6 }}>Thanks for reaching out — we&apos;ll be in touch shortly.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <input className={s.field} placeholder="Name" required />
                  <input className={s.field} type="email" placeholder="Email" required />
                  <textarea className={s.field} placeholder="Tell us about your project" rows={4} style={{ resize: "vertical" }} required />
                  <Press style={{ width: "100%" }}><Button variant="primary" className={s.btnGlow} size="lg" block type="submit">Send message</Button></Press>
                </form>
              )}
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ---------------- footer ---------------- */
export function Footer() {
  const NAV = site.nav as [string, string][];
  return (
    <footer style={{ position: "relative", zIndex: 9, borderTop: "1px solid var(--border-subtle)", background: "var(--bg-subtle)", padding: "48px 0 36px" }}>
      <div className={s.wrap} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/assets/logo-mark.png" alt="" style={{ height: 28, width: "auto" }} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>Gienah</span>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          {NAV.map(([label, id]) =>
            id.startsWith("/") ? (
              <a key={id} className={s.navlink} href={id}>{label}</a>
            ) : (
              <span key={id} className={s.navlink} onClick={() => go(id)}>{label}</span>
            )
          )}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["instagram", "linkedin", "github"].map((n) => <a key={n} href="#" style={{ color: "var(--text-tertiary)" }}><Icon name={n} size={19} /></a>)}
        </div>
      </div>
      <div className={s.wrap} style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--text-tertiary)" }}>© 2026 Gienah. Creating digital experiences beyond your expectations.</div>
    </footer>
  );
}
