"use client";
import React from "react";
import { Button, Badge, Icon } from "@/components";
import { ScrollProgress, siteStyles } from "@/site/helpers";
import { HeadingReveal } from "@/site/HeadingReveal";
import { Stagger, StaggerItem, FadeIn, Lift, Press } from "@/site/motion";
import { motion, useReducedMotion } from "motion/react";
import productsData from "@/data/products.json";
import type { Product, Tone } from "@/data/types";
import d from "./projectDetail.module.css";

const PRODUCTS = productsData as Product[];
const ORDER = PRODUCTS.map((p) => p.id);
const EASE = [0.22, 1, 0.36, 1] as const;

function toneBg(tone: Tone, strong: boolean) {
  if (tone === "gold") return strong ? "linear-gradient(150deg, #f4d485, #e2aa3b 70%, #c68d28)" : "linear-gradient(150deg, #fdf6e6, #f4d485)";
  return strong ? "linear-gradient(150deg, #a7d8f1, #2a92cc 70%, #1f7cae)" : "linear-gradient(150deg, #ecf6fc, #a7d8f1)";
}

const techTokens = (tech: string) => tech.split(/[·,•|]/).map((t) => t.trim()).filter(Boolean);

/* Reusable case-study extras: use authored data when present, otherwise derive
   premium fallbacks from category/tech so EVERY project renders fully. */
function deriveHighlights(p: Product): { icon: string; title: string; desc: string }[] {
  if (p.highlights?.length) return p.highlights.slice(0, 4);
  const t = p.tech.toLowerCase();
  const c = p.category.toLowerCase();
  const out: { icon: string; title: string; desc: string }[] = [];
  const add = (icon: string, title: string, desc: string) => { if (out.length < 4 && !out.some((o) => o.title === title)) out.push({ icon, title, desc }); };
  if (/\bai\b|llm|ml\b|intelligen/.test(t)) add("sparkles", "AI-powered", "Smart features tuned to each user's intent.");
  if (/pwa/.test(c) || /pwa/.test(t)) add("smartphone", "Installable PWA", "App-like, fast, and offline-ready — no store needed.");
  if (/admin|panel|dashboard/.test(c)) add("layout-dashboard", "Admin tooling", "Operational dashboards for the team behind it.");
  if (/real-?time|live|socket|node/.test(t)) add("activity", "Real-time experience", "Live data with instant, seamless updates.");
  add("palette", "Considered UI/UX", "A clean, premium interface from first tap to last.");
  add("smartphone", "Fully responsive", "Fluid and sharp from mobile to desktop.");
  add("gauge", "Built to scale", "Architected for growth and real-world performance.");
  add("shield-check", "Robust & reliable", "Stable foundations users can trust.");
  return out.slice(0, 4);
}

function deriveDelivered(p: Product): string[] {
  if (p.delivered?.length) return p.delivered;
  const t = p.tech.toLowerCase();
  const c = p.category.toLowerCase();
  const out: string[] = ["UI/UX Design"];
  out.push(/pwa/.test(c) || /pwa/.test(t) ? "PWA Development" : "Frontend Engineering");
  out.push("Product Architecture");
  if (/\bai\b|llm|ml\b/.test(t)) out.push("AI Integration");
  if (/real-?time|live|socket|node/.test(t)) out.push("Real-time Experience");
  out.push("Responsive Interface");
  if (/admin|panel|dashboard/.test(c)) out.push("Admin Dashboard");
  return [...new Set(out)].slice(0, 6);
}

/* opacity + y + scale reveal (reduced motion → instant; targets kept identical
   for hydration safety, only the transition changes). */
function RevealScale({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y: 26, scale: 0.965 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={reduce ? { duration: 0 } : { duration: 0.7, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>Project not found</div>
        <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>That case study doesn&apos;t exist.</p>
        <div style={{ marginTop: 18 }}><Button variant="primary" className={siteStyles.btnGlow} as="a" href="/">Back to Gienah</Button></div>
      </div>
    </div>
  );
}

export function ProjectDetail({ id }: { id: number }) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return <div className={d.page}><NotFound /></div>;
  const idx = ORDER.indexOf(id);
  const next = PRODUCTS.find((x) => x.id === ORDER[(idx + 1) % ORDER.length])!;
  const shots = p.shots.length ? p.shots : Array.from({ length: 3 }, () => null);
  const catBadge = p.tone === "gold" ? siteStyles.darkBadgeWarning : siteStyles.darkBadgeAccent;
  const highlights = deriveHighlights(p);
  const delivered = deriveDelivered(p);
  const tokens = techTokens(p.tech);

  return (
    <div className={d.page} data-tone={p.tone}>
      <div className={d.canvas} aria-hidden="true"><div className={d.canvasStars} /></div>
      <ScrollProgress />
      <div style={{ height: 3, background: "var(--brand-gradient)" }} />
      <header className={d.header}>
        <div className={d.wrap} style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <img src="/assets/logo-mark.png" alt="" style={{ height: 28, width: "auto" }} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>Gienah</span>
          </a>
          <Press><Button size="sm" variant="ghost" className={siteStyles.btnGhostDark} as="a" href="/" leadingIcon={<Icon name="arrow-left" size={15} />}>All projects</Button></Press>
        </div>
      </header>

      {/* ---------- cinematic hero ---------- */}
      <section className={d.hero}>
        {/* subtle, off-centre project glow — sits to the side, never behind the title/CTA */}
        <div className={d.heroGlow} aria-hidden="true" />
        <div className={d.heroStars} aria-hidden="true" />
        <div className={d.wrap} style={{ position: "relative", zIndex: 1 }}>
          <FadeIn>
            <div className={d.kicker}>Case study</div>
          </FadeIn>
          <Stagger style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0 4px" }} gap={0.07}>
            <StaggerItem as="span"><Badge variant={p.tone === "gold" ? "warning" : "accent"} className={catBadge}>{p.category}</Badge></StaggerItem>
            <StaggerItem as="span"><Badge variant="neutral" className={siteStyles.darkBadgeNeutral}>{p.year}</Badge></StaggerItem>
          </Stagger>
          <HeadingReveal as="h1" className={d.heroTitle} segments={[{ text: p.title }]} />
          {p.blurb && <FadeIn delay={0.1}><p className={d.heroLede}>{p.blurb}</p></FadeIn>}
          <FadeIn delay={0.16}>
            <div className={d.stackRow}>
              {tokens.map((t) => <span key={t} className={d.stackPill}>{t}</span>)}
            </div>
          </FadeIn>
          {(p.website || p.download) && (
            <FadeIn delay={0.22}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
                {p.website && <Press><Button variant="primary" className={siteStyles.btnGlow} as="a" href={p.website} target="_blank" rel="noopener" trailingIcon={<Icon name="external-link" size={15} />}>Visit website</Button></Press>}
                {p.download && <Press><Button variant="secondary" className={siteStyles.btnSecondaryDark} as="a" href={p.download} target="_blank" rel="noopener" leadingIcon={<Icon name="download" size={15} />}>Download</Button></Press>}
              </div>
            </FadeIn>
          )}
        </div>
      </section>

      {/* ---------- main showcase ---------- */}
      <section className={d.wrap} style={{ position: "relative", zIndex: 2, marginTop: -6 }}>
        <RevealScale>
          <figure className={d.showcase}>
            <div className={d.showGlow} aria-hidden="true" />
            <div className={d.showInner} style={{ background: p.banner ? "var(--bg-subtle)" : toneBg(p.tone, true) }}>
              {p.banner ? (
                <img src={p.banner} alt={p.title} />
              ) : (
                <div className={d.showPlaceholder}>
                  <img src="/assets/logo-mark.png" alt="" style={{ height: 56, width: "auto", opacity: 0.95 }} />
                  <div style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, letterSpacing: "-0.02em" }}>{p.title}</div>
                </div>
              )}
              <span className={d.sweep} aria-hidden="true" />
            </div>
          </figure>
        </RevealScale>
      </section>

      {/* ---------- overview + at a glance ---------- */}
      <section style={{ position: "relative", overflow: "hidden", zIndex: 1 }}>
        <div className={d.softGlow} data-pos="left" aria-hidden="true" />
        <div className={d.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 64, paddingBottom: 24 }}>
          <div className={d.overviewGrid}>
            <div>
              <FadeIn><div className={d.eyebrow}>Overview</div></FadeIn>
              {p.desc.map((para, i) => (
                <FadeIn key={i} delay={0.05 + i * 0.04}><p className={d.body}>{para}</p></FadeIn>
              ))}
            </div>
            <FadeIn delay={0.1}>
              <aside className={d.aside}>
                <Lift className={d.glance}>
                  <div className={d.glanceTitle}>At a glance</div>
                  {([["Year", p.year], ["Category", p.category], ["Stack", p.tech]] as [string, string][]).map(([k, v]) => (
                    <div key={k} className={d.glanceRow}>
                      <span className={d.glanceKey}>{k}</span>
                      <span className={d.glanceVal}>{v}</span>
                    </div>
                  ))}
                  {(p.website || p.download) && (
                    <div className={d.glanceCta}>
                      {p.website && <Button size="sm" variant="primary" className={siteStyles.btnGlow} as="a" href={p.website} target="_blank" rel="noopener" trailingIcon={<Icon name="arrow-up-right" size={14} />}>Visit</Button>}
                      {p.download && <Button size="sm" variant="secondary" className={siteStyles.btnSecondaryDark} as="a" href={p.download} target="_blank" rel="noopener">Download</Button>}
                    </div>
                  )}
                </Lift>
              </aside>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ---------- project highlights ---------- */}
      <section className={d.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 28, paddingBottom: 12 }}>
        <FadeIn><div className={d.eyebrow}>Project highlights</div></FadeIn>
        <Stagger className={d.highlights} gap={0.08}>
          {highlights.map((h) => (
            <Lift asItem key={h.title} className={d.hcard}>
              <span className={d.hIcon}><Icon name={h.icon} size={22} /></span>
              <div className={d.hTitle}>{h.title}</div>
              <div className={d.hDesc}>{h.desc}</div>
            </Lift>
          ))}
        </Stagger>
      </section>

      {/* ---------- what we delivered ---------- */}
      <section className={d.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 36, paddingBottom: 12 }}>
        <FadeIn><div className={d.eyebrow}>What we delivered</div></FadeIn>
        <Stagger className={d.delivered} gap={0.06}>
          {delivered.map((item) => (
            <StaggerItem key={item} className={d.ditem}>
              <span className={d.dDot}><Icon name="check" size={14} /></span>
              <span>{item}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ---------- screens gallery ---------- */}
      <section className={d.wrap} style={{ position: "relative", zIndex: 1, paddingTop: 40, paddingBottom: 80 }}>
        <FadeIn><div className={d.eyebrow} style={{ marginBottom: 22 }}>Screens</div></FadeIn>
        <Stagger className={d.gallery} gap={0.07}>
          {shots.map((src, i) => (
            <Lift asItem key={i} className={d.gItem}>
              <div className={d.gShot} style={{ background: src ? "var(--bg-subtle)" : toneBg(p.tone, i % 2 === 0) }}>
                {src ? (
                  <img src={src} alt={`${p.title} screen ${i + 1}`} />
                ) : (
                  <div className={d.showPlaceholder}>
                    <img src="/assets/logo-mark.png" alt="" style={{ height: 34, width: "auto", opacity: 0.9 }} />
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", opacity: 0.82 }}>Screen {i + 1}</div>
                  </div>
                )}
              </div>
            </Lift>
          ))}
        </Stagger>
      </section>

      {/* ---------- cinematic outro / next + cta ---------- */}
      <section className={d.outro}>
        <div className={d.outroGlow} aria-hidden="true" />
        <div className={d.wrap} style={{ position: "relative", zIndex: 1 }}>
          <div className={d.outroGrid}>
            <FadeIn>
              <a href={`/projects/${next.id}`} className={d.nextProject}>
                <span className={d.nextKicker}>Next project</span>
                <span className={d.nextTitle}>{next.title}<Icon name="arrow-right" size={22} /></span>
                <span className={d.nextMeta}>{next.category}</span>
              </a>
            </FadeIn>
            <FadeIn delay={0.08}>
              <div className={d.outroCta}>
                <div className={d.outroCtaText}>Have a product in mind?</div>
                <Press><Button variant="primary" className={[siteStyles.btnGlow, d.ctaBtn].join(" ")} size="lg" as="a" href="/#contact" trailingIcon={<Icon name="arrow-right" size={16} />}>Start a project</Button></Press>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  );
}
