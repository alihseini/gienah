"use client";
import React from "react";
import { Button, Icon } from "@/components";
import { ScrollProgress, siteStyles } from "@/site/helpers";
import { HeadingReveal } from "@/site/HeadingReveal";
import { Stagger, FadeIn, Lift, Press } from "@/site/motion";
import site from "@/data/site.json";
import c from "./careers.module.css";

type Role = { title: string; meta: string; icon: string };
const ROLES = site.roles as Role[];

/* Editable, reusable content for the supporting sections. */
const WHY = [
  { icon: "users", title: "Small senior team", desc: "No layers, no busywork — you work directly with the people shipping the product." },
  { icon: "target", title: "High ownership", desc: "Own real surfaces end to end, from the first sketch to production." },
  { icon: "gem", title: "Craft-focused", desc: "We sweat the details. Design and engineering quality are the point, not an afterthought." },
  { icon: "waves", title: "Calm shipping culture", desc: "Steady momentum over crunch — clarity, focus, and a sustainable pace." },
];

const HOW = [
  "Senior, async-friendly collaboration",
  "Design and engineering, close together",
  "Small teams, high trust",
  "Ship with clarity and momentum",
];

export function CareersPage() {
  return (
    <div className={c.page}>
      <div className={c.canvas} aria-hidden="true"><div className={c.canvasStars} /><div className={c.canvasStars2} /></div>
      <ScrollProgress />
      <div style={{ height: 3, background: "var(--brand-gradient)" }} />
      <header className={c.header}>
        <div className={c.wrap} style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <img src="/assets/logo-mark.png" alt="" style={{ height: 28, width: "auto" }} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>Gienah</span>
          </a>
          <Press><Button size="sm" variant="ghost" className={siteStyles.btnGhostDark} as="a" href="/" leadingIcon={<Icon name="arrow-left" size={15} />}>Back to home</Button></Press>
        </div>
      </header>

      {/* ---------- hero ---------- */}
      <section className={c.hero}>
        <div className={c.heroGlow} aria-hidden="true" />
        <div className={c.heroStars} aria-hidden="true" />
        <div className={c.heroStar} aria-hidden="true" />
        <div className={c.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 100, paddingBottom: 72, textAlign: "center" }}>
          <FadeIn><div className={c.kicker}>Join Gienah</div></FadeIn>
          <HeadingReveal as="h1" className={c.heroTitle} segments={[{ text: "Build the next one" }, { text: "with us.", accent: true }]} />
          <FadeIn delay={0.12}><p className={c.heroLede}>We&apos;re a small, senior team that ships. If you care about craft and momentum, we&apos;d love to talk.</p></FadeIn>
        </div>
      </section>

      {/* ---------- open roles ---------- */}
      <section className={c.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 52, paddingBottom: 12 }}>
        <FadeIn><div className={c.eyebrow}>Open roles</div></FadeIn>
        <Stagger className={c.jobs} gap={0.07}>
          {ROLES.map((r) => (
            <Lift asItem key={r.title}>
              <a href={`mailto:${site.email}?subject=Application — ${encodeURIComponent(r.title)}`} className={c.jobLink}>
                <div className={c.jobCard}>
                  <div className={c.jobLeft}>
                    <span className={c.jobIcon}><Icon name={r.icon} size={21} /></span>
                    <div>
                      <div className={c.jobTitle}>{r.title}</div>
                      <div className={c.jobMeta}>{r.meta}</div>
                    </div>
                  </div>
                  <span className={c.jobArrow}><Icon name="arrow-right" size={20} /></span>
                </div>
              </a>
            </Lift>
          ))}
        </Stagger>
      </section>

      {/* ---------- why join ---------- */}
      <section className={c.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 48, paddingBottom: 12 }}>
        <FadeIn><div className={c.eyebrow}>Why join Gienah?</div></FadeIn>
        <Stagger className={c.why} gap={0.08}>
          {WHY.map((w) => (
            <Lift asItem key={w.title} className={c.whyCard}>
              <span className={c.whyIcon}><Icon name={w.icon} size={22} /></span>
              <div className={c.whyTitle}>{w.title}</div>
              <div className={c.whyDesc}>{w.desc}</div>
            </Lift>
          ))}
        </Stagger>
      </section>

      {/* ---------- how we work ---------- */}
      <section className={c.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 36, paddingBottom: 8 }}>
        <FadeIn>
          <div className={c.howStrip}>
            {HOW.map((h) => (
              <span key={h} className={c.howItem}>
                <span className={c.howDot}><Icon name="check" size={13} /></span>
                {h}
              </span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ---------- bottom cta ---------- */}
      <section className={c.cta} style={{ marginTop: 64 }}>
        <div className={c.ctaGlow} aria-hidden="true" />
        <div className={c.wrap} style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
          <FadeIn><p className={c.ctaText}>Don&apos;t see your role? Tell us what you do best — we hire for talent, not just titles.</p></FadeIn>
          <FadeIn delay={0.08}>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Press><Button variant="primary" size="lg" className={siteStyles.btnGlow} as="a" href={`mailto:${site.email}`} leadingIcon={<Icon name="mail" size={17} />}>{site.email}</Button></Press>
              <Press><Button variant="secondary" size="lg" className={siteStyles.btnSecondaryDark} as="a" href="/#contact">Start a project</Button></Press>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
