"use client";
import React from "react";
import { Button, Badge, Icon } from "@/shared/components";
import { CountUp, ScrollParallax, siteStyles as s, go } from "@/shared/utils/helpers";
import { StarField } from "@/shared/utils/starfield/StarField";
import { HeroAtmosphere } from "@/shared/utils/heroAtmosphere/HeroAtmosphere";
import { HeadingReveal } from "@/shared/utils/headingReveal/HeadingReveal";
import { TypingAnimation } from "@/shared/utils/typing/TypingAnimation";
import { Stagger, StaggerItem, FadeIn, Press } from "@/shared/utils/motion/motion";
import { GienahLight } from "@/shared/utils/gienahLight/GienahLight";
import { SectionConnector } from "@/shared/utils/sectionConnector/SectionConnector";
import c from "./constellationJourney.module.css";
import site from "@/shared/data/site.json";
import { reduceMotion } from "../sectionUtils";

/* ---------------- hero ---------------- */
export function Hero() {
  const sectionRef = React.useRef<HTMLElement>(null);
  const atmoRef = React.useRef<HTMLDivElement>(null);

  // very subtle pointer parallax on the background layers only (text stays still).
  // atmosphere drifts a little, the constellation a little more, for soft depth.
  React.useEffect(() => {
    if (reduceMotion()) return;
    if (window.matchMedia && !window.matchMedia("(pointer: fine)").matches) return;
    let raf = 0;
    let visible = true;
    let x = 0, y = 0, tx = 0, ty = 0;
    let lastTransform = "";
    const tick = () => {
      raf = 0;
      if (!visible) return;
      x += (tx - x) * 0.08; y += (ty - y) * 0.08;
      const a = atmoRef.current;
      const nextTransform = `translate3d(${(-x * 10).toFixed(2)}px, ${(-y * 8).toFixed(2)}px, 0)`;
      if (a && nextTransform !== lastTransform) {
        a.style.transform = nextTransform;
        lastTransform = nextTransform;
      }
      if (Math.abs(tx - x) > 0.001 || Math.abs(ty - y) > 0.001) raf = requestAnimationFrame(tick);
    };
    const onMove = (e: MouseEvent) => {
      if (!visible) return;
      tx = e.clientX / window.innerWidth - 0.5;
      ty = e.clientY / window.innerHeight - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    }, { rootMargin: "160px" });
    if (sectionRef.current) io.observe(sectionRef.current);
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => { io.disconnect(); window.removeEventListener("mousemove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section ref={sectionRef} id="top" className={s.page} data-anim-pause style={{ overflow: "hidden", padding: "172px 0 110px", position: "relative", zIndex: 0 }}>
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
          lcpSafe
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
