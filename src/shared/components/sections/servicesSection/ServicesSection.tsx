"use client";
import React from "react";
import { Icon } from "@/shared/components";
import { SectionHead, siteStyles as s } from "@/shared/utils/helpers";
import { SectionConnector } from "@/shared/utils/sectionConnector/SectionConnector";
import { SectionStars } from "@/shared/utils/sectionStars/SectionStars";
import servicesData from "@/shared/data/services.json";
import type { Service } from "@/shared/data/types";
import { reduceMotion, _clamp, _lerp, easeOutCubic, smoothstep } from "../sectionUtils";
import { stableViewportHeight } from "@/shared/utils/viewport";

const SERVICES = servicesData as Service[];

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
 *                 (soft and dim), the immediate-next one fading up as it nears.
 *   - -1 → 0    : ENTERING — slides UP from that bottom-peek to fill the deck, fading
 *                 in with a premium ease. It rides on top (z = i+1), so
 *                 it covers the previous card as it rises ("comes from down, goes on
 *                 top of the previous card").
 *   - rel > 0   : PASSED — it does NOT recede/shrink away; it stays put and only
 *                 eases up a little so its header peeks above the new active card,
 *                 staying prominent behind it (high opacity floor, near full scale).
 * The three phases are continuous at rel = -1 and rel = 0, so the whole thing is one
 * smooth scroll-linked curve — never jumpy. `H` is the live deck height, so the rise
 * distance and bottom-peek scale with the actual card size at every breakpoint. */
type CardStyle = { transform: string; opacity: number };
const CARD_STYLE_CACHE = new WeakMap<HTMLElement, CardStyle>();
function computeCardStyle(i: number, head: number, mobile: boolean, H: number): CardStyle {
  const rel = head - i;
  const ENTER = Math.max(220, H * 0.88);        // rise distance ⇒ ~12% bottom-peek
  const PEEK_TOP = mobile ? 0 : 18;             // header sliver each passed card shows
  let y: number, opacity: number, scale: number;

  if (rel >= 0) {
    // passed/active: stays in place, only eases up to peek above the new top card.
    // On phones PEEK_TOP is 0 (taller single-column cards would poke over the title),
    // so passed cards simply sit covered — the rise-over still reads during scroll.
    const d = Math.min(rel, 3);
    y = -PEEK_TOP * d;
    scale = 1 - 0.018 * d;
    opacity = Math.max(0.5, 1 - 0.14 * d);
  } else if (rel >= -1) {
    // entering: rise from the bottom-peek up to active, fading in.
    const t = easeOutCubic(rel + 1);            // 0 at rel=-1 → 1 at rel=0
    y = _lerp(ENTER, 0, t);
    scale = _lerp(0.96, 1, t);
    opacity = _lerp(0.35, 1, smoothstep(rel + 1));
  } else {
    // waiting below: the immediate-next card peeks a sliver at the bottom, the rest
    // stay hidden until they're next (opacity fades 0 → 0.35 as rel climbs -2 → -1).
    y = ENTER;
    scale = 0.96;
    opacity = _lerp(0, 0.35, _clamp(rel + 2, 0, 1));
  }

  return {
    transform: `translate3d(0, ${y.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`,
    opacity: Number(opacity.toFixed(3)),
  };
}

function writeCardStyle(el: HTMLElement, st: CardStyle) {
  const prev = CARD_STYLE_CACHE.get(el);
  if (prev?.transform !== st.transform) el.style.transform = st.transform;
  if (prev?.opacity !== st.opacity) el.style.opacity = String(st.opacity);
  CARD_STYLE_CACHE.set(el, st);
}

export function Services() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const deckRef = React.useRef<HTMLDivElement>(null);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const idxRef = React.useRef(0);
  // `active` is the rounded playhead — used ONLY for the discrete bits (dots, aria,
  // pointer-events, dimmed ring). It changes a handful of times across the whole
  // scroll, so it never drives a per-frame re-render. The continuous transform /
  // opacity is written straight to each card's DOM node in rAF (below),
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
      const vh = stableViewportHeight();
      if (r.bottom < -vh * 0.2 || r.top > vh * 1.2) return;
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
      <section id="services" className={s.panel} data-anim-pause style={{ background: "var(--page-bg)", overflow: "hidden", padding: "120px 0 96px", position: "relative", zIndex: 2 }}>
        <SectionStars />
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
    <section id="services" className={s.panel} data-anim-pause style={{ background: "var(--page-bg)", overflow: "clip", position: "relative", zIndex: 2 }}>
      <div ref={trackRef} className={s.svcTrack} style={{ position: "relative", zIndex: 1, ["--svc-count" as string]: N }}>
        <div className={s.svcStage} style={{ position: "sticky", top: 0, display: "flex", flexDirection: "column", justifyContent: "center", boxSizing: "border-box", overflow: "hidden", background: "var(--page-bg)" }}>
          <SectionStars />
          {/* connector lives inside the pinned stage so it never drifts from the
              (sticky) title nodes; it draws in the side lanes, behind the deck */}
          <SectionConnector sectionKey="services" enter="l" exit="r" />
          <div className={s.wrap} style={{ width: "100%", position: "relative", zIndex: 1 }}>
            {Header}
            {/* The deck. Every card is absolutely stacked (inset:0); z-index = i+1 so
                each new card layers ABOVE the previous one (newest in front, earlier
                ones peeking behind). transform/opacity start from CSS (.svcCard
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
