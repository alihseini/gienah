"use client";
import React from "react";
import { Button, Card, Icon } from "@/shared/components";
import { Reveal, ScrollParallax, siteStyles as s, go } from "@/shared/utils/helpers";
import { BackgroundBeams } from "@/shared/utils/bgbeams/BackgroundBeams";
import { HeadingReveal } from "@/shared/utils/headingReveal/HeadingReveal";
import { TypingAnimation } from "@/shared/utils/typing/TypingAnimation";
import { Stagger, Lift } from "@/shared/utils/motion/motion";
import { TitleNodes } from "@/shared/utils/titleNodes/TitleNodes";
import { SectionConnector } from "@/shared/utils/sectionConnector/SectionConnector";
import { SectionStars } from "@/shared/utils/sectionStars/SectionStars";
import site from "@/shared/data/site.json";

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
        <Stagger style={{ display: "flex", flexDirection: "column", gap: 14 }} gap={0.13} amount={0.3}>
          {site.about.stats.map(([ic, t, d]) => (
            <Lift asItem key={t} y={0} x={52}>
              <Card padding={20} className={[s.glassCard, s.cardHoverGlow].join(" ")}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "var(--accent-600)", display: "inline-flex" }}><Icon name={ic} size={22} /></span>
                  <div style={{ fontSize: 17, fontWeight: 600 }}>{t}</div>
                </div>
                <div style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 8, lineHeight: 1.5 }}>{d}</div>
              </Card>
            </Lift>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
