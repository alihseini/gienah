"use client";
import React from "react";
import { Button, Badge, Card, Icon } from "@/components";
import {
  Reveal, CountUp, SectionHead, AnimatedBG, ScrollParallax, siteStyles as s, go,
} from "./helpers";
import { LightPillar } from "./LightPillar";
import { ParticleField } from "./ParticleField";
import { BackgroundBeams } from "./BackgroundBeams";
import { StarField } from "./StarField";
import { LogoConstellation } from "./LogoConstellation";
import { HeroAtmosphere } from "./HeroAtmosphere";
import { Aurora } from "./Aurora";
import { Meteors } from "./Meteors";
import { HeadingReveal } from "./HeadingReveal";
import { TypingAnimation } from "./TypingAnimation";
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
    <section id="top" className={s.page} style={{ overflow: "hidden", padding: "150px 0 110px" }}>
      {/* layered background, all behind content & with different scroll speeds for depth:
          atmosphere (slowest glow) → stars (medium) → main constellation (fastest).
          Each keeps its existing pointer-parallax / float; the wrappers only add the
          scroll-linked drift on top, so text & buttons stay perfectly still. */}
      <ScrollParallax max={30}><HeroAtmosphere ref={atmoRef} /></ScrollParallax>
      <ScrollParallax max={48}><StarField /></ScrollParallax>
      <ScrollParallax max={64}>
        <div ref={constRef} style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", willChange: "transform" }}>
          <LogoConstellation />
        </div>
      </ScrollParallax>
      <div className={s.wrap} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
        <Reveal>
          <div style={{ display: "inline-flex", marginBottom: 26 }}>
            <Badge variant="outline" className={s.darkBadgeOutline} leadingIcon={<Icon name="sparkles" size={13} />}>{site.hero.badge}</Badge>
          </div>
        </Reveal>
        <HeadingReveal
          as="h1"
          style={{ fontSize: "clamp(40px, 7vw, 82px)", lineHeight: 1.02, fontWeight: 700, letterSpacing: "-0.04em", margin: "0 auto", maxWidth: 980, color: "#fff" }}
          segments={[{ text: site.hero.titleLead }, { text: site.hero.titleAccent, accent: true }]}
        />
        <Reveal delay={140}>
          <TypingAnimation as="p" text={site.hero.sub} style={{ fontSize: 20, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 600, margin: "26px auto 0" }} />
        </Reveal>
        <Reveal delay={210}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 34, flexWrap: "wrap" }}>
            <Button size="lg" variant="primary" className={s.btnGlow} onClick={() => go("contact")}>Start a project</Button>
            <Button size="lg" variant="secondary" trailingIcon={<Icon name="arrow-down" size={16} />} onClick={() => go("products")}>See our work</Button>
          </div>
        </Reveal>
        <div style={{ display: "flex", justifyContent: "center", gap: "clamp(28px,6vw,72px)", marginTop: 64, flexWrap: "wrap" }}>
          {site.hero.stats.map(([n, l], i) => (
            <Reveal key={l} delay={300 + i * 90} variant="scale">
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}><CountUp value={n} /></div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>{l}</div>
              </div>
            </Reveal>
          ))}
        </div>
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
          display: "grid", gridTemplateColumns: "minmax(0, 0.92fr) minmax(0, 1.08fr)", gap: "clamp(28px, 4vw, 64px)", alignItems: "center",
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 22px" }}>
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
    transform = `translate3d(0, ${(-depth * 26).toFixed(1)}px, 0) scale(${(1 - depth * 0.05).toFixed(3)})`;
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

export function Services() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const idxRef = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const [reduce] = React.useState(reduceMotion);
  const N = SERVICES.length;
  React.useEffect(() => {
    if (reduce) return;
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
  }, [reduce, N]);

  const Header = (
    <SectionHead tag="#Services" light title="Everything from idea to launch" sub="Four disciplines, one team — so your product stays coherent from the first conversation to its first users." />
  );

  if (reduce) {
    return (
      <section id="services" className={s.panel} style={{ background: "linear-gradient(180deg, #0c1729, #0a1322 70%)", overflow: "hidden", padding: "120px 0 96px", position: "relative", zIndex: 2 }}>
        <Aurora />
        <Meteors />
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
    <section id="services" className={s.panel} style={{ background: "#0a1322", overflow: "clip", position: "relative", zIndex: 2 }}>
      <div ref={trackRef} style={{ position: "relative", zIndex: 1, height: `${N * 88}vh` }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", padding: "100px 0 52px", boxSizing: "border-box", overflow: "hidden", background: "linear-gradient(180deg, #0c1729, #0a1322 70%)" }}>
          <Aurora />
          <Meteors />
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
      <div className={s.deviceScreen} style={{ background: bg, padding: shot ? 0 : 24 }}>
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

export function Featured() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const idxRef = React.useRef(0);
  const [active, setActive] = React.useState(0);
  const N = FEATURED.length;
  React.useEffect(() => {
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
  }, [N]);
  return (
    <section id="products" className={[s.panel, s.overlap].join(" ")} style={{ background: "#102338", position: "relative", overflow: "clip", zIndex: 3 }}>
      <div ref={trackRef} style={{ position: "relative", zIndex: 1, height: `${N * 88}vh` }}>
        <div style={{ position: "sticky", top: 0, height: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", paddingTop: 92, paddingBottom: 44, boxSizing: "border-box", overflow: "hidden", background: "linear-gradient(158deg, #0e2236 0%, #14304a 32%, #3a3a36 58%, #7c5f2c 78%, #102338 100%)" }}>
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
            <LightPillar topColor="#2A92CC" bottomColor="#F4C65F" intensity={1} rotationSpeed={0.3} glowAmount={0.002} pillarWidth={3} pillarHeight={0.4} noiseIntensity={0.5} pillarRotation={25} interactive={false} mixBlendMode="screen" quality="high" />
          </div>
          <div className={s.wrap} style={{ width: "100%", position: "relative", zIndex: 1 }}>
            <SectionHead tag="#Products" title="Work we're proud of" sub="A few of the products we've designed and engineered end to end." />
            <div style={{ position: "relative", height: "min(560px, 62vh)", marginTop: 6 }}>
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

function MorePreview({ p }: { p: Product }) {
  const media = p.banner || p.shots[0] || null;
  const toneBg = p.tone === "gold" ? "linear-gradient(150deg, #f4d485, #e2aa3b 70%, #c68d28)" : "linear-gradient(150deg, #a7d8f1, #2a92cc 70%, #1f7cae)";
  const tags = p.tech.split("·").map((x) => x.trim()).filter(Boolean).slice(0, 4);
  return (
    <a href={`/projects/${p.id}`} className={m.preview} data-parallax="32">
      <div className={m.media} key={`media-${p.id}`}>
        {media ? (
          <img src={media} alt={p.title} />
        ) : (
          <div className={m.placeholder} style={{ background: toneBg }}>
            <img src="/assets/logo-mark.png" alt="" style={{ height: 56, width: "auto", opacity: 0.92 }} />
          </div>
        )}
      </div>
      <div className={m.overlay} />
      <div className={m.body} key={`body-${p.id}`}>
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
    </a>
  );
}

export function MoreProducts() {
  const [active, setActive] = React.useState(MORE[0].id);
  const cur = MORE.find((p) => p.id === active) || MORE[0];
  return (
    <section className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" style={{ background: "linear-gradient(180deg, #0a1322, #0c1a30)", overflow: "hidden", padding: "120px 0 96px", zIndex: 4 }}>
      {/* background blobs drift slower than the content for soft parallax depth */}
      <ScrollParallax max={62} style={{ opacity: 0.4 }}><AnimatedBG variant="blobs" /></ScrollParallax>
      <div className={[s.wrap, s.layer].join(" ")} data-layer="front" style={{ position: "relative", zIndex: 1 }}>
        <HeadingReveal as="div" className={s.eyebrow} style={{ textAlign: "center", marginBottom: 8 }} segments={[{ text: "More from the studio" }]} />
        <Reveal delay={60}><TypingAnimation as="p" text="Hover a project to preview it — click to open the case study." style={{ textAlign: "center", fontSize: 16, color: "var(--text-secondary)", margin: "0 0 8px" }} /></Reveal>
        <div className={m.explorer}>
          <div className={m.list} onMouseLeave={() => setActive(MORE[0].id)}>
            {MORE.map((p, i) => (
              <a
                key={p.id}
                href={`/projects/${p.id}`}
                className={m.row}
                data-parallax={String(10 + (i % 3) * 7)}
                onMouseEnter={() => setActive(p.id)}
                onFocus={() => setActive(p.id)}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
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
  const SECTION_BG = "linear-gradient(150deg, #0c2236 0%, #134063 26%, #1f5478 44%, #6e5a2c 64%, #b08a36 82%, #14304d 100%)";
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const spineRef = React.useRef<HTMLDivElement>(null);

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

  // draw the connection line with scroll progress
  React.useEffect(() => {
    if (reduceMotion()) return;
    const root = timelineRef.current, spine = spineRef.current;
    if (!root || !spine) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / (r.height || 1)));
      spine.style.setProperty("--p", String(p));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="agile" className={[s.panel, s.overlap].join(" ")} style={{ background: SECTION_BG, color: "var(--ink-text)", overflow: "hidden", padding: "120px 0", position: "relative", zIndex: 5 }}>
      <ScrollParallax max={56}><div className={ag.beam} aria-hidden="true" /></ScrollParallax>
      <div className={s.wrap} style={{ position: "relative", zIndex: 1 }}>
        <SectionHead tag="#AGILE_METHODOLOGY" light title="How we ship — calmly, every sprint" sub="A predictable rhythm from first conversation to production. Hover any stage to see what happens inside it." />
        <div className={ag.timeline} ref={timelineRef}>
          <div className={ag.spine} ref={spineRef} aria-hidden="true">
            <div className={ag.spineBase} />
            <div className={ag.spineDraw} />
          </div>
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
    <section id="about" className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" style={{ background: "var(--bg-base)", overflow: "hidden", padding: "120px 0", zIndex: 6 }}>
      <ScrollParallax max={52}><BackgroundBeams /></ScrollParallax>
      <div className={[s.wrap, s.layer].join(" ")} data-layer="front" style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(32px,6vw,80px)", alignItems: "center" }}>
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
        <Reveal delay={120}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {site.about.stats.map(([ic, t, d], i) => (
              <Card key={t} padding={20} className={s.glassCard} data-parallax={String(18 + (i % 2) * 14)} style={{ marginTop: i % 2 ? 24 : 0 }}>
                <span style={{ color: "var(--accent-600)" }}><Icon name={ic} size={22} /></span>
                <div style={{ fontSize: 17, fontWeight: 600, marginTop: 12 }}>{t}</div>
                <div style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>{d}</div>
              </Card>
            ))}
          </div>
        </Reveal>
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
    <section id="contact" className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" style={{ background: "var(--bg-base)", overflow: "hidden", padding: "120px 0", zIndex: 7 }}>
      {/* overscan (inset:-90) so the scroll translate/scale can never expose a bare
          strip — the layer always covers the section; the section clips the excess. */}
      <div ref={bgRef} style={{ position: "absolute", inset: -90, willChange: "opacity, filter, transform", transition: "opacity .2s linear" }}>
        <AnimatedBG variant="glow" />
      </div>
      <ParticleField progressRef={progRef} />
      <div ref={ref} className={s.wrap} style={{ maxWidth: 1000, position: "relative", zIndex: 1, transformOrigin: "center center", willChange: "transform" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "clamp(32px,6vw,72px)", alignItems: "start" }}>
          <div>
            <Reveal><div className={s.eyebrow}>#CONTACT_US</div></Reveal>
            <HeadingReveal as="h2" style={{ fontSize: "clamp(32px,4.4vw,52px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "14px 0 0", lineHeight: 1.05 }} segments={[{ text: "Hey." }, { br: true }, { text: "Let's talk.", accent: true }]} />
            <Reveal delay={130}><TypingAnimation as="p" text="Tell us about your idea, your timeline, or just say hi. We reply to every message." style={{ fontSize: 17, lineHeight: 1.65, color: "var(--text-secondary)", marginTop: 18, maxWidth: 380 }} /></Reveal>
            <Reveal delay={190}>
              <a href={`mailto:${site.email}`} style={{ display: "inline-flex", alignItems: "center", gap: 10, marginTop: 24, fontSize: 18, fontWeight: 600, color: "var(--text-accent)" }}>
                <Icon name="mail" size={20} /> {site.email}
              </a>
            </Reveal>
          </div>
          <Reveal delay={120}>
            <Card padding={26} className={s.glassCard} style={{ boxShadow: "var(--shadow-lg)" }}>
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
                  <Button variant="primary" className={s.btnGlow} size="lg" block type="submit">Send message</Button>
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
