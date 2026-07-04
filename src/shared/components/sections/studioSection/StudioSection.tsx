"use client";
import React from "react";
import { Badge, Icon, ImageLazy } from "@/shared/components";
import { Reveal, siteStyles as s } from "@/shared/utils/helpers";
import { HeadingReveal } from "@/shared/utils/headingReveal/HeadingReveal";
import { TypingAnimation } from "@/shared/utils/typing/TypingAnimation";
import { TitleNodes } from "@/shared/utils/titleNodes/TitleNodes";
import { SectionConnector } from "@/shared/utils/sectionConnector/SectionConnector";
import m from "./moreExplorer.module.css";
import productsData from "@/shared/data/products.json";
import type { Product } from "@/shared/data/types";

const PRODUCTS = productsData as Product[];
const MORE = PRODUCTS.filter((p) => !p.featured);

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
          <ImageLazy src={media} alt={p.title} />
        ) : (
          <div className={m.placeholder} style={{ background: toneBg }}>
            <ImageLazy src="/assets/logo-mark.png" alt="" style={{ height: 56, width: "auto", opacity: 0.92 }} />
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
    <section id="studio" className={[s.page, s.panel, s.overlap].join(" ")} data-sx="front" data-anim-pause style={{ background: "transparent", overflow: "hidden", padding: "120px 0 96px", zIndex: 4 }}>
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
