"use client";
import React from "react";
import { Button, Badge, Icon } from "@/components";
import { Reveal, Parallax, ScrollProgress } from "@/site/helpers";
import productsData from "@/data/products.json";
import type { Product, Tone } from "@/data/types";
import d from "./projectDetail.module.css";

const PRODUCTS = productsData as Product[];
const ORDER = PRODUCTS.map((p) => p.id);

function toneBg(tone: Tone, strong: boolean) {
  if (tone === "gold") return strong ? "linear-gradient(150deg, #f4d485, #e2aa3b 70%, #c68d28)" : "linear-gradient(150deg, #fdf6e6, #f4d485)";
  return strong ? "linear-gradient(150deg, #a7d8f1, #2a92cc 70%, #1f7cae)" : "linear-gradient(150deg, #ecf6fc, #a7d8f1)";
}

function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>Project not found</div>
        <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>That case study doesn&apos;t exist.</p>
        <div style={{ marginTop: 18 }}><Button variant="primary" as="a" href="/">Back to Gienah</Button></div>
      </div>
    </div>
  );
}

export function ProjectDetail({ id }: { id: number }) {
  const p = PRODUCTS.find((x) => x.id === id);
  if (!p) return <div className={d.page}><NotFound /></div>;
  const idx = ORDER.indexOf(id);
  const nextId = ORDER[(idx + 1) % ORDER.length];
  const next = PRODUCTS.find((x) => x.id === nextId)!;
  const shots = p.shots.length ? p.shots : Array.from({ length: 2 }, () => null);

  return (
    <div className={d.page}>
      <ScrollProgress />
      <div style={{ height: 3, background: "var(--brand-gradient)" }} />
      <header className={d.header}>
        <div className={d.wrap} style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <img src="/assets/logo-mark.png" alt="" style={{ height: 28, width: "auto" }} />
            <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>Gienah</span>
          </a>
          <Button size="sm" variant="ghost" as="a" href="/" leadingIcon={<Icon name="arrow-left" size={15} />}>All projects</Button>
        </div>
      </header>

      {/* hero / banner */}
      <section style={{ position: "relative", overflow: "hidden" }}>
        <Parallax factor={0.18} style={{ position: "absolute", inset: "-20% 0" }}>
          <div style={{ position: "absolute", inset: 0, background: p.tone === "gold" ? "radial-gradient(700px 320px at 30% 24%, var(--gold-50), transparent 66%)" : "radial-gradient(700px 320px at 30% 24%, var(--accent-50), transparent 66%)" }} />
        </Parallax>
        <div className={d.wrap} style={{ position: "relative", paddingTop: 60, paddingBottom: 36 }}>
          <Reveal>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
              <Badge variant={p.tone === "gold" ? "warning" : "accent"}>{p.category}</Badge>
              <Badge variant="neutral">{p.year}</Badge>
            </div>
          </Reveal>
          <Reveal delay={70} variant="blur"><h1 style={{ fontSize: "clamp(40px, 7vw, 78px)", fontWeight: 700, letterSpacing: "-0.04em", margin: 0, lineHeight: 1.02 }}>{p.title}</h1></Reveal>
          <Reveal delay={130}><div style={{ fontFamily: "var(--font-mono)", fontSize: 13.5, color: "var(--text-tertiary)", marginTop: 16 }}>{p.tech}</div></Reveal>
          {(p.website || p.download) && (
            <Reveal delay={190}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
                {p.website && <Button variant="primary" as="a" href={p.website} target="_blank" rel="noopener" trailingIcon={<Icon name="external-link" size={15} />}>Visit website</Button>}
                {p.download && <Button variant="secondary" as="a" href={p.download} target="_blank" rel="noopener" leadingIcon={<Icon name="download" size={15} />}>Download</Button>}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* banner image */}
      <section className={d.wrap} style={{ paddingBottom: 8 }}>
        <Reveal variant="scale">
          <div className={d.shot} style={{ height: "min(440px, 44vw)", background: p.banner ? "var(--bg-subtle)" : toneBg(p.tone, true) }}>
            {p.banner ? (
              <img src={p.banner} alt={p.title} />
            ) : (
              <>
                <img src="/assets/logo-mark.png" alt="" style={{ height: 56, width: "auto", opacity: 0.95 }} />
                <div style={{ fontSize: "clamp(24px,3vw,34px)", fontWeight: 700, letterSpacing: "-0.02em" }}>{p.title}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".08em", opacity: 0.8 }}>Project banner</div>
              </>
            )}
          </div>
        </Reveal>
      </section>

      {/* description */}
      <section className={d.wrap} style={{ paddingTop: 56, paddingBottom: 56 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.6fr) minmax(0, 1fr)", gap: "clamp(28px,5vw,64px)", alignItems: "start" }}>
          <div>
            <Reveal><div className={d.eyebrow}>Overview</div></Reveal>
            {p.desc.map((para, i) => (
              <Reveal key={i} delay={60 + i * 40}><p style={{ fontSize: 17.5, lineHeight: 1.75, color: "var(--text-secondary)", margin: "16px 0 0" }}>{para}</p></Reveal>
            ))}
          </div>
          <Reveal delay={120} variant="right">
            <div style={{ border: "1px solid var(--border-subtle)", borderRadius: 14, padding: 20, background: "var(--bg-subtle)" }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>At a glance</div>
              {([["Year", p.year], ["Category", p.category], ["Stack", p.tech]] as [string, string][]).map(([k, v]) => (
                <div key={k} style={{ display: "flex", flexDirection: "column", gap: 2, padding: "10px 0", borderTop: "1px solid var(--border-subtle)" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>{k}</span>
                  <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{v}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* screenshots */}
      <section className={d.wrap} style={{ paddingBottom: 80 }}>
        <Reveal><div className={d.eyebrow} style={{ marginBottom: 20 }}>Screens</div></Reveal>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 18 }}>
          {shots.map((src, i) => (
            <Reveal key={i} delay={i * 60} variant="scale">
              <div className={d.shot} style={{ aspectRatio: "9 / 16", background: src ? "var(--bg-subtle)" : toneBg(p.tone, i % 2 === 0) }}>
                {src ? (
                  <img src={src} alt={`${p.title} screen ${i + 1}`} />
                ) : (
                  <>
                    <img src="/assets/logo-mark.png" alt="" style={{ height: 36, width: "auto", opacity: 0.9 }} />
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".08em", opacity: 0.82 }}>Screen {i + 1}</div>
                  </>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* next + cta */}
      <section style={{ borderTop: "1px solid var(--border-subtle)", background: "var(--bg-subtle)", padding: "44px 0" }}>
        <div className={d.wrap} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <a href={`/projects/${nextId}`} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--text-tertiary)" }}>Next project</span>
            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", display: "inline-flex", alignItems: "center", gap: 8 }}>{next.title} <Icon name="arrow-right" size={20} /></span>
          </a>
          <Button variant="primary" size="lg" as="a" href="/#contact">Start a project</Button>
        </div>
      </section>
    </div>
  );
}
