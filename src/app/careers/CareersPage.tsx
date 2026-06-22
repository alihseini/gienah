"use client";
import React from "react";
import { Card, Button, Icon } from "@/components";
import { Reveal, AnimatedBG, ScrollProgress, siteStyles } from "@/site/helpers";
import { HeadingReveal } from "@/site/HeadingReveal";
import site from "@/data/site.json";
import c from "./careers.module.css";

export function CareersPage() {
  return (
    <div className={c.page}>
      <ScrollProgress />
      <div style={{ height: 3, background: "var(--brand-gradient)" }} />
      <header className={c.header}>
        <div className={c.wrap} style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <img src="/assets/logo-mark.png" alt="" style={{ height: 28, width: "auto" }} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>Gienah</span>
          </a>
          <Button size="sm" variant="ghost" className={siteStyles.btnGhostDark} as="a" href="/" leadingIcon={<Icon name="arrow-left" size={15} />}>Back to home</Button>
        </div>
      </header>

      <section className={c.hero}>
        <AnimatedBG variant="lines" />
        <div className={c.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 96, paddingBottom: 68, textAlign: "center" }}>
          <Reveal><div className={c.eyebrow}>#JOB_OPPORTUNITIES</div></Reveal>
          <HeadingReveal as="h1" style={{ fontSize: "clamp(40px,7vw,72px)", fontWeight: 700, letterSpacing: "-0.04em", lineHeight: 1.04, margin: "14px auto 0", maxWidth: 860, color: "#fff" }} segments={[{ text: "Build the next one" }, { text: "with us.", accent: true }]} />
          <Reveal delay={140}><p style={{ fontSize: 19, lineHeight: 1.6, color: "var(--text-secondary)", maxWidth: 560, margin: "20px auto 0" }}>We&apos;re a small, senior team that ships. If you care about craft and momentum, we&apos;d love to talk.</p></Reveal>
        </div>
      </section>

      <section className={c.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 48, paddingBottom: 56 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          {site.roles.map((r, i) => (
            <Reveal key={r.title} delay={i * 70}>
              <a href={`mailto:${site.email}?subject=Application`} style={{ display: "block", height: "100%" }}>
                <Card interactive padding={22} className={[siteStyles.glassCard, siteStyles.glassCardInteractive].join(" ")} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, height: "100%" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ width: 46, height: 46, borderRadius: 12, background: "var(--brand-gradient-soft)", color: "var(--accent-600)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icon name={r.icon} size={21} /></span>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 600 }}>{r.title}</div>
                      <div style={{ fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 2 }}>{r.meta}</div>
                    </div>
                  </div>
                  <span style={{ color: "var(--text-tertiary)" }}><Icon name="arrow-right" size={20} /></span>
                </Card>
              </a>
            </Reveal>
          ))}
        </div>
      </section>

      <section style={{ position: "relative", overflow: "hidden", borderTop: "1px solid var(--border-subtle)", background: "var(--bg-subtle)", padding: "64px 0" }}>
        <AnimatedBG variant="glow" />
        <div className={c.wrap} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <Reveal><p style={{ fontSize: 16, color: "var(--text-secondary)", margin: "0 0 18px" }}>Don&apos;t see your role? Tell us what you do best.</p></Reveal>
          <Reveal delay={80}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Button variant="primary" size="lg" className={siteStyles.btnGlow} as="a" href={`mailto:${site.email}`}>{site.email}</Button>
              <Button variant="secondary" size="lg" className={siteStyles.btnSecondaryDark} as="a" href="/#contact">Start a project</Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
