"use client";
import React from "react";
import { Button, Badge, Icon } from "@/shared/components";
import { CountUp, siteStyles as s, go } from "@/shared/utils/helpers";
import { HeadingReveal } from "@/shared/utils/headingReveal/HeadingReveal";
import { TypingAnimation } from "@/shared/utils/typing/TypingAnimation";
import { Stagger, StaggerItem, FadeIn, Press } from "@/shared/utils/motion/motion";
import { GienahLight } from "@/shared/utils/gienahLight/GienahLight";
import { SectionConnector } from "@/shared/utils/sectionConnector/SectionConnector";
import c from "./constellationJourney.module.css";
import site from "@/shared/data/site.json";

/* ---------------- hero ---------------- */
export function Hero() {
  return (
    <section id="top" className={s.page} data-anim-pause style={{ overflow: "hidden", padding: "172px 0 110px", position: "relative", zIndex: 0 }}>
      <GienahLight pos="corner" tone="mixed" size="md" flare twinkle />
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
        <Stagger className={s.heroStats} style={{ display: "flex", justifyContent: "center", gap: "clamp(28px,6vw,72px)", marginTop: 64, flexWrap: "wrap" }} gap={0.1} delayChildren={0.28} amount={0.4}>
          {site.hero.stats.map(([n, l]) => (
            <StaggerItem key={l} className={s.heroStatItem} y={14} style={{ textAlign: "center" }}>
              <div className={s.heroStat} style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em" }}><CountUp value={n} /></div>
              <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 2 }}>{l}</div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
