"use client";
import React from "react";
import { Button, Badge, Card, Icon } from "@/components";
import {
  Reveal, CountUp, SectionHead, ScrollParallax, siteStyles as s, go,
} from "./helpers";
import { ParticleField } from "./ParticleField";
import { BackgroundBeams } from "./BackgroundBeams";
import { StarField } from "./StarField";
import { HeroAtmosphere } from "./HeroAtmosphere";
import { Meteors } from "./Meteors";
import { HeadingReveal } from "./HeadingReveal";
import { TypingAnimation } from "./TypingAnimation";
import { Stagger, StaggerItem, FadeIn, Lift, Press } from "./motion";
import { GienahLight } from "./GienahLight";
import { TitleNodes } from "./TitleNodes";
import { SectionConnector } from "./SectionConnector";
import { ProductStoryline } from "./ProductStoryline";
import c from "./constellationJourney.module.css";
import { SectionStars } from "./SectionStars";
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

const _clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const _lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const smoothstep = (t: number) => t * t * (3 - 2 * t);

/* ---------------- hero ---------------- */
export function Hero() {
  const atmoRef = React.useRef<HTMLDivElement>(null);

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
      const a = atmoRef.current;
      if (a) a.style.transform = `translate3d(${(-x * 10).toFixed(2)}px, ${(-y * 8).toFixed(2)}px, 0)`;
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
    <section id="top" className={s.page} style={{ overflow: "hidden", padding: "172px 0 110px", position: "relative", zIndex: 0 }}>
      {/* layered background, all behind content & with different scroll speeds for depth:
          atmosphere (slowest glow) → stars (medium) → main constellation (fastest).
          Each keeps its existing pointer-parallax / float; the wrappers only add the
          scroll-linked drift on top, so text & buttons stay perfectly still.
          The .heroBg wrapper masks the top so the starfield/constellation fades out
          of the navbar zone (never sits behind the floating nav). */}
      <div className={s.heroBg} aria-hidden="true">
        <ScrollParallax max={30}><HeroAtmosphere ref={atmoRef} /></ScrollParallax>
        <ScrollParallax max={48}><StarField /></ScrollParallax>
        {/* Gienah light signature: a subtle off-centre star tucked into a safe
            corner — never behind the headline/CTA; the hero star field stays the
            main identity */}
        <GienahLight pos="corner" tone="mixed" size="md" flare twinkle />
      </div>
      {/* the constellation journey begins from this Hero star, then this section's
          connector draws the first leg down toward Services (behind the content) */}
      <span data-node="hero:star" className={c.heroStar} aria-hidden="true" />
      <SectionConnector sectionKey="hero" role="start" exit="l" />
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
              <div className={s.heroStat} style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}><CountUp value={n} /></div>
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
          <div className={s.svcIconRow} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22 }}>
            <span className={s.floatIcon} style={{ width: 64, height: 64, borderRadius: 18, background: "var(--brand-gradient-soft)", color: gold ? "var(--gold-700)" : "var(--accent-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", boxShadow: `0 10px 30px -10px ${glowA}` }}><Icon name={svc.icon} size={30} /></span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, color: accent, letterSpacing: "0.04em" }}>SERVICE {svc.no}</span>
          </div>
          <h3 style={{ fontSize: "clamp(34px, 4.4vw, 54px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 18px", color: "#fff", lineHeight: 1.04 }}>{svc.title}</h3>
          <p style={{ fontSize: "clamp(16px, 1.4vw, 19px)", lineHeight: 1.65, color: "var(--ink-text-dim)", margin: "0 0 24px", maxWidth: 440 }}>{svc.desc}</p>
          <div className={s.svcTags} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {svc.tags.map((tg) => (
              <span key={tg} style={{ fontSize: 13, fontWeight: 500, color: "#fff", padding: "7px 14px", borderRadius: 99, background: "rgba(255,255,255,0.07)", border: `1px solid ${gold ? "rgba(244,198,95,0.34)" : "rgba(88,171,206,0.34)"}` }}>{tg}</span>
            ))}
          </div>
        </div>
        <div className={s.svcCapsBlock} style={{ position: "relative", zIndex: 1 }}>
          <div className={s.svcCapsLabel} style={{ fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-text-dim)", marginBottom: 16 }}>Capabilities</div>
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

/* Continuous scroll-progress card model — AIR "trusted advisor" stacking.
 * `head` is a fractional position in the deck (0 … N-1): the deck's "playhead".
 * For each card we work in `rel = head - i` (negative = still to come, 0 = active,
 * positive = already passed):
 *   - rel < -1  : waiting below the fold — peeks a sliver at the BOTTOM of the deck
 *                 (soft, blurred, dim), the immediate-next one fading up as it nears.
 *   - -1 → 0    : ENTERING — slides UP from that bottom-peek to fill the deck, fading
 *                 in + de-blurring with a premium ease. It rides on top (z = i+1), so
 *                 it covers the previous card as it rises ("comes from down, goes on
 *                 top of the previous card").
 *   - rel > 0   : PASSED — it does NOT recede/shrink away; it stays put and only
 *                 eases up a little so its header peeks above the new active card,
 *                 staying prominent behind it (high opacity floor, near full scale).
 * The three phases are continuous at rel = -1 and rel = 0, so the whole thing is one
 * smooth scroll-linked curve — never jumpy. `H` is the live deck height, so the rise
 * distance and bottom-peek scale with the actual card size at every breakpoint. */
type CardStyle = { transform: string; opacity: number; filter: string };
function computeCardStyle(i: number, head: number, mobile: boolean, H: number): CardStyle {
  const rel = head - i;
  const ENTER = Math.max(220, H * 0.88);        // rise distance ⇒ ~12% bottom-peek
  const PEEK_TOP = mobile ? 0 : 18;             // header sliver each passed card shows
  let y: number, opacity: number, blur: number, scale: number, bright: number;

  if (rel >= 0) {
    // passed/active: stays in place, only eases up to peek above the new top card.
    // On phones PEEK_TOP is 0 (taller single-column cards would poke over the title),
    // so passed cards simply sit covered — the rise-over still reads during scroll.
    const d = Math.min(rel, 3);
    y = -PEEK_TOP * d;
    scale = 1 - 0.018 * d;
    opacity = Math.max(0.5, 1 - 0.14 * d);
    blur = 1.1 * d;                              // subtle, just pushes it back
    bright = Math.max(0.72, 1 - 0.09 * d);
  } else if (rel >= -1) {
    // entering: rise from the bottom-peek up to active, fading in + de-blurring.
    const t = easeOutCubic(rel + 1);            // 0 at rel=-1 → 1 at rel=0
    y = _lerp(ENTER, 0, t);
    scale = _lerp(0.96, 1, t);
    opacity = _lerp(0.35, 1, smoothstep(rel + 1));
    blur = _lerp(8, 0, t);
    bright = _lerp(0.85, 1, t);
  } else {
    // waiting below: the immediate-next card peeks a sliver at the bottom, the rest
    // stay hidden until they're next (opacity fades 0 → 0.35 as rel climbs -2 → -1).
    y = ENTER;
    scale = 0.96;
    opacity = _lerp(0, 0.35, _clamp(rel + 2, 0, 1));
    blur = 8;
    bright = 0.85;
  }

  const parts: string[] = [];
  if (blur > 0.12) parts.push(`blur(${blur.toFixed(2)}px)`);
  if (bright < 0.999) parts.push(`brightness(${bright.toFixed(3)})`);

  return {
    transform: `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
    opacity: Number(opacity.toFixed(3)),
    filter: parts.length ? parts.join(" ") : "none",
  };
}

function writeCardStyle(el: HTMLElement, st: CardStyle) {
  el.style.transform = st.transform;
  el.style.opacity = String(st.opacity);
  el.style.filter = st.filter;
}

export function Services() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const deckRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const idxRef = React.useRef(0);
  // `active` is the rounded playhead — used ONLY for the discrete bits (dots, aria,
  // pointer-events, dimmed ring). It changes a handful of times across the whole
  // scroll, so it never drives a per-frame re-render. The continuous transform /
  // opacity / blur are written straight to each card's DOM node in rAF (below),
  // never through React state, so scrolling costs zero React work.
  const [active, setActive] = React.useState(0);
  // reduced-motion is detected AFTER mount so the server and the first client
  // render agree (both render the sticky version) — reading it synchronously in
  // useState made the reduced client hydrate a different tree than the SSR'd one
  // (hydration mismatch / React #418).
  const [reduce, setReduce] = React.useState(false);
  React.useEffect(() => { setReduce(reduceMotion()); }, []);
  // phones + tablets recede the deck without the upward lift (see computeCardStyle).
  // Kept in a ref so the rAF loop reads the live value without re-subscribing.
  const mobileRef = React.useRef(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => { mobileRef.current = mq.matches; };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  // Every breakpoint uses the same scroll-progress deck as desktop (no swipe
  // carousel on mobile/tablet). Reduced-motion still falls back to a plain stack.
  const N = SERVICES.length;
  React.useEffect(() => {
    if (reduce) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = trackRef.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const dist = el.offsetHeight - vh;
      const scrolled = _clamp(-r.top, 0, dist);
      // complete the reveal at 90% of the travel, leaving a brief "hold" on the last
      // card before the section unpins — feels deliberate rather than abrupt.
      const progress = dist > 0 ? _clamp(scrolled / (dist * 0.9), 0, 1) : 0;
      const head = progress * (N - 1);          // continuous playhead across the deck
      const H = deckRef.current?.offsetHeight || vh * 0.5;   // live card height
      for (let i = 0; i < N; i++) {
        const node = cardRefs.current[i];
        if (node) writeCardStyle(node, computeCardStyle(i, head, mobileRef.current, H));
      }
      const ni = _clamp(Math.round(head), 0, N - 1);
      if (ni !== idxRef.current) { idxRef.current = ni; setActive(ni); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduce, N]);

  const Header = (
    <SectionHead nodeId="services" tag="#Services" light title="Everything from idea to launch" sub="Four disciplines, one team — so your product stays coherent from the first conversation to its first users." />
  );

  if (reduce) {
    return (
      <section id="services" className={s.panel} style={{ background: "var(--page-bg)", overflow: "hidden", padding: "120px 0 96px", position: "relative", zIndex: 2 }}>
        <SectionStars />
        <Meteors />
        <SectionConnector sectionKey="services" enter="l" exit="r" />
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
        <div className={s.svcStage} style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box", overflow: "hidden", background: "var(--page-bg)" }}>
          <SectionStars />
          <Meteors />
          {/* connector lives inside the pinned stage so it never drifts from the
              (sticky) title nodes; it draws in the side lanes, behind the deck */}
          <SectionConnector sectionKey="services" enter="l" exit="r" />
          <div className={s.wrap} style={{ width: "100%", position: "relative", zIndex: 1 }}>
            {Header}
            {/* The deck. Every card is absolutely stacked (inset:0); z-index = i+1 so
                each new card layers ABOVE the previous one (newest in front, earlier
                ones peeking behind). transform/opacity/filter start from CSS (.svcCard
                defaults = the head===0 resting state, so no pre-JS flash) and are then
                owned by the rAF writer. They're intentionally NOT in this JSX style so
                an `active` re-render can't clobber the live scroll values. */}
            <div className={s.svcDeck} ref={deckRef}>
              {SERVICES.map((svc, i) => (
                <div
                  key={svc.title}
                  ref={(el) => { cardRefs.current[i] = el; }}
                  className={s.svcCard}
                  aria-hidden={i !== active}
                  style={{
                    position: "absolute", inset: 0,
                    zIndex: i + 1,
                    transformOrigin: "center top",
                    pointerEvents: i === active ? "auto" : "none",
                    willChange: "transform, opacity, filter",
                    backfaceVisibility: "hidden",
                  }}
                >
                  <ServicePanel s={svc} dim={i < active} />
                </div>
              ))}
            </div>
            <div className={s.deckDots} style={{ display: "flex", justifyContent: "center", gap: 9, marginTop: 22 }}>
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
    <div className={s.device} data-pj-mockup="">
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

/* One product row in the vertical journey. It starts in a hidden pre-reveal state
   (.pjRow in the CSS: opacity 0, translateY + slight scale + blur) and animates in
   once ProductStoryline flips its data-revealed (when the storyline head reaches
   this row's node). Alternation is data-reverse → CSS grid order, so odd rows put
   the mockup on the right. Mockup + content reuse the existing product visuals. */
function ProductRow({ p, i }: { p: Product; i: number }) {
  const reverse = i % 2 === 1;
  return (
    <article className={s.pjRow} data-pj-row={i} data-reverse={reverse ? "" : undefined}>
      <div className={s.pjMedia}>
        <span className={s.pjMediaGlow} aria-hidden="true" data-tone={p.tone} />
        <PhoneFrame p={p} />
      </div>
      <div className={s.pjBody}>
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
    </article>
  );
}

/* Products — a normal vertical journey (NOT a pinned/sticky deck any more). All
   featured products render as alternating left/right rows in document flow; a
   ProductStoryline snakes down the centre gutter and reveals each row as its node
   is reached. The global page-wide journey (SectionConnector) is unchanged: it
   still draws this section's slice through the side lanes + title node and flips
   the section's JourneyGate. */
export function Featured() {
  return (
    <section id="products" className={[s.panel, s.overlap].join(" ")} style={{ background: "var(--page-bg)", position: "relative", overflow: "clip", zIndex: 3, padding: "120px 0 130px" }}>
      <SectionStars />
      {/* Global journey: ARRIVE at the products title (header zone) + fire the gate,
          but draw no body-crossing exit leg — the alternating full-width rows leave
          no empty side lane, so the page line hands the journey off to the centre
          ProductStoryline here (role="end" = entry + activation only, like Contact). */}
      <SectionConnector sectionKey="products" role="end" enter="r" />
      <div className={s.wrap} style={{ position: "relative", zIndex: 1 }}>
        <SectionHead nodeId="products" tag="#Products" title="Work we're proud of" sub="A few of the products we've designed and engineered end to end." />
        {/* vertical journey: storyline (centre gutter, z 0) behind the rows (z 1) */}
        <div className={s.pjList}>
          <ProductStoryline count={FEATURED.length} />
          {FEATURED.map((p, i) => <ProductRow key={p.id} p={p} i={i} />)}
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
    <section id="studio" className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" style={{ background: "var(--page-bg)", overflow: "hidden", padding: "120px 0 96px", zIndex: 4 }}>
      {/* base color → continuous stars only (the moving topology/triangle network
          was removed — keeps the same calm cosmic base as every other section) */}
      <SectionStars />
      {/* incoming drops straight down onto the title node (the Products storyline
          hands the journey down from directly above), then bows over the title and
          exits right toward Agile — no detour out to the side lane */}
      <SectionConnector sectionKey="studio" enter="l" exit="r" enterTop />
      {/* layer 2: content — NO scroll-choreography transform here: it would shift the
          title's connector nodes out from under the (separately measured) line */}
      <div className={s.wrap} style={{ position: "relative", zIndex: 2 }}>
        <div style={{ textAlign: "center" }}>
          <TitleNodes id="studio">
            <HeadingReveal
              as="h2"
              style={{ fontSize: "clamp(28px, 3.6vw, 40px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "0 0 8px", lineHeight: 1.1, color: "#fff", textAlign: "center" }}
              segments={[{ text: "More from the studio" }]}
            />
          </TitleNodes>
        </div>
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
      // mobile vertical rail: clamp it to span exactly first-node → last-node (it
      // otherwise ran the full timeline height, poking above the first node and past
      // the last). Offset-based so the cards' reveal transforms don't skew it.
      const dotCenter = (slot: HTMLElement) => {
        const c = slot.firstElementChild as HTMLElement | null; // the .connector dot
        return slot.offsetTop + (c ? c.offsetTop + c.offsetHeight / 2 : 0);
      };
      const railTop = dotCenter(slots[0]);
      const railBottom = h - dotCenter(slots[slots.length - 1]);
      root.style.setProperty("--rail-top", `${railTop.toFixed(1)}px`);
      root.style.setProperty("--rail-bottom", `${railBottom.toFixed(1)}px`);
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
      {/* global journey: line arrives at the Agile title node, then GAPS (Agile's
          own internal line owns the middle), and resumes from the lower handoff
          node toward Contact */}
      <SectionConnector sectionKey="agile" enter="r" exit="l" gap />
      <div className={s.wrap} style={{ position: "relative", zIndex: 1 }}>
        {/* no side nodes on the Agile title — the global line hands off directly to
            the first Agile card's node (and out of the last card's node) instead */}
        <SectionHead nodeId="agile" nodeSides={false} tag="#AGILE_METHODOLOGY" light title="How we ship — calmly, every sprint" sub="A predictable rhythm from first conversation to production. Hover any stage to see what happens inside it." />
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
            // the global journey hands off into the Agile timeline: it lands on the
            // FIRST card's node, then (after the internal line) resumes from the LAST
            // card's node toward Contact.
            const nodeAttr = i === 0 ? "agile:r" : i === AGILE.length - 1 ? "agile:exitlow" : undefined;
            return (
              <div key={st.name} data-slot className={[ag.slot, right ? ag.right : ag.left].join(" ")}>
                <span className={ag.connector} data-node={nodeAttr} aria-hidden="true" />
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
      <SectionStars />
      <ScrollParallax max={52}><BackgroundBeams /></ScrollParallax>
      {/* About is a real stop on the journey: the line comes down the left lane,
          lands on the About node, then continues down the same lane to Contact —
          so it never crosses About's two-column content */}
      <SectionConnector sectionKey="about" enter="l" exit="l" />
      {/* no scroll-choreography transform here — it would drift the About connector
          node out from under the line */}
      <div className={[s.wrap, s.respGrid2].join(" ")} style={{ position: "relative", zIndex: 1, gap: "clamp(32px,6vw,80px)", alignItems: "center" }}>
        <div>
          <Reveal><div className={s.eyebrow}>#ABOUT_US</div></Reveal>
          <TitleNodes id="about">
            <HeadingReveal as="h2" style={{ fontSize: "clamp(30px,4vw,44px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "14px 0 0", lineHeight: 1.1 }} segments={[{ text: "A studio built to take products" }, { text: "all the way.", accent: true }]} />
          </TitleNodes>
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
      // NOTE: the content used to RISE on scroll (translateY) here, but that shifted
      // the contact title's connector node out from under the (separately measured)
      // journey line. The wrap now stays put — the inner Reveals handle entrance —
      // so the final line lands cleanly on the contact node. Only the decorative
      // background still drifts (it carries no connector anchor).
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
      <SectionStars />
      {/* AnimatedBG glow wash removed — keep the same clean base + stars; the
          ParticleField is the section's particle signature */}
      <div ref={bgRef} style={{ position: "absolute", inset: -90, willChange: "opacity, filter, transform", transition: "opacity .2s linear" }} />
      <ParticleField progressRef={progRef} />
      {/* final leg: drawn only when it arrives (never pre-drawn) — lands on contact:l */}
      <SectionConnector sectionKey="contact" role="end" enter="l" />
      <div ref={ref} className={s.wrap} style={{ maxWidth: 1000, position: "relative", zIndex: 1, transformOrigin: "center center", willChange: "transform" }}>
        <div className={s.respGrid2} style={{ gap: "clamp(32px,6vw,72px)", alignItems: "start" }}>
          <div>
            <Reveal><div className={s.eyebrow}>#CONTACT_US</div></Reveal>
            <TitleNodes id="contact">
              <HeadingReveal as="h2" style={{ fontSize: "clamp(32px,4.4vw,52px)", fontWeight: 700, letterSpacing: "-0.03em", margin: "14px 0 0", lineHeight: 1.05 }} segments={[{ text: "Hey." }, { br: true }, { text: "Let's talk.", accent: true }]} />
            </TitleNodes>
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
    <footer style={{ position: "relative", zIndex: 9, background: "transparent", padding: "56px 0 40px" }}>
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
