"use client";
import React from "react";
import { Button, Badge, Icon, ImageLazy } from "@/shared/components";
import { SectionHead, siteStyles as s } from "@/shared/utils/helpers";
import { SectionConnector } from "@/shared/utils/sectionConnector/SectionConnector";
import { ProductStoryline } from "@/shared/utils/productStoryline/ProductStoryline";
import { SectionStars } from "@/shared/utils/sectionStars/SectionStars";
import productsData from "@/shared/data/products.json";
import type { Product } from "@/shared/data/types";

const PRODUCTS = productsData as Product[];
const FEATURED = PRODUCTS.filter((p) => p.featured);

/* ---------------- products ---------------- */
function ProductImage({ p }: { p: Product }) {
  const tone = p.tone;
  const bg = tone === "gold"
    ? "linear-gradient(160deg, #fdf6e6, #f4d485 55%, #e2aa3b)"
    : "linear-gradient(160deg, #ecf6fc, #a7d8f1 55%, #2a92cc)";
  const fg = tone === "gold" ? "var(--gold-800)" : "var(--accent-800)";
  const shot = p.landingShot;
  return (
    <div className={s.device} data-pj-media="">
      {shot ? (
        <ImageLazy className={s.productShot} src={shot} alt={p.title} />
      ) : (
        <div className={s.productFallback} style={{ background: bg }}>
          <ImageLazy src="/assets/logo-mark.png" alt="" style={{ height: 44, width: "auto", opacity: 0.92 }} />
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: fg }}>{p.title}</div>
          <div className={s.deviceTag} style={{ color: fg, opacity: 0.7 }}>App preview</div>
        </div>
      )}
    </div>
  );
}

/* One product row in the vertical journey. It starts in a hidden pre-reveal state
   (.pjRow in the CSS: opacity 0, translateY + slight scale + blur) and animates in
   once ProductStoryline flips its data-revealed (when the storyline head reaches
   this row's node). Alternation is data-reverse → CSS grid order, so odd rows put
   the image on the right. Product visual + content reuse the existing product data. */
function ProductRow({ p, i }: { p: Product; i: number }) {
  const reverse = i % 2 === 1;
  return (
    <article className={s.pjRow} data-pj-row={i} data-reverse={reverse ? "" : undefined}>
      <div className={s.pjMedia}>
        <span className={s.pjMediaGlow} aria-hidden="true" data-tone={p.tone} />
        <ProductImage p={p} />
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
    <section id="products" className={[s.panel, s.overlap].join(" ")} data-anim-pause style={{ background: "var(--page-bg)", position: "relative", overflow: "clip", zIndex: 3, padding: "120px 0 130px" }}>
      <SectionStars />
      {/* Global journey: arrive at the title (right node), bow OVER the title to the
          left node like every other section — then stop. No exit leg down: the
          alternating full-width rows leave no side lane, so the ProductStoryline
          departs from that left node and carries the journey down to Studio. */}
      <SectionConnector sectionKey="products" enter="r" exit="l" noExitLeg />
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
