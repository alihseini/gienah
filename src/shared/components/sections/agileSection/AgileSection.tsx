"use client";
import React from "react";
import { Icon } from "@/shared/components";
import { SectionHead, ScrollParallax, siteStyles as s } from "@/shared/utils/helpers";
import { StarField } from "@/shared/utils/starfield/StarField";
import { SectionConnector } from "@/shared/utils/sectionConnector/SectionConnector";
import ag from "./agileStage.module.css";
import agileData from "@/shared/data/agile.json";
import type { AgileStage } from "@/shared/data/types";
import { reduceMotion } from "../sectionUtils";
import { stableViewportHeight } from "@/shared/utils/viewport";

const AGILE = agileData as AgileStage[];

/* ---------------- agile ---------------- */
function AgilePanel({ st, i }: { st: AgileStage; i: number }) {
  const gold = i % 2 === 1;
  const accent = gold ? "var(--gold-400)" : "var(--accent-400)";
  const rgb = gold ? "244,198,95" : "88,171,206";
  return (
    <div className={ag.panel}>
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className={ag.iconChip} style={{ color: accent }}><Icon name={st.icon} size={26} /></span>
          <span className={ag.num} style={{ color: accent }}>0{i + 1}</span>
        </div>
        <div className={ag.name}>{st.name}</div>
        <div>
          {st.items.map((it) => (
            <div key={it} className={ag.item}><span className={ag.dot} style={{ background: accent }} />{it}</div>
          ))}
        </div>
      </div>
      <div className={ag.illus}>
        <div className={ag.illusGlow} data-parallax="30" style={{ background: `radial-gradient(circle at 60% 42%, rgba(${rgb},0.28), transparent 65%)` }} />
        <div className={ag.illusIcon} data-parallax="46" style={{ color: `rgba(${rgb},0.5)` }}><Icon name={st.icon} size={132} /></div>
        <span className={[ag.streak, gold ? "" : ag.streakBlue].join(" ")} style={{ top: "22%", ["--sd" as string]: "7s" } as React.CSSProperties} />
        <span className={ag.streak} style={{ top: "50%", ["--sd" as string]: "9s", animationDelay: "-2s" } as React.CSSProperties} />
        <span className={[ag.streak, gold ? "" : ag.streakBlue].join(" ")} style={{ top: "76%", ["--sd" as string]: "8s", animationDelay: "-4s" } as React.CSSProperties} />
      </div>
    </div>
  );
}

export function Agile() {
  const timelineRef = React.useRef<HTMLDivElement>(null);
  // curved connector path through every card's node, measured from layout (so the
  // cards' reveal transforms never shift the anchors). Recomputed on resize.
  const [conn, setConn] = React.useState<{ d: string; w: number; h: number } | null>(null);

  // reveal each card when it nears the viewport (runs once; stays revealed on scroll-up)
  React.useEffect(() => {
    const root = timelineRef.current;
    if (!root) return;
    const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-slot]"));
    if (reduceMotion()) {
      slots.forEach((el) => (el.dataset.shown = ""));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { (e.target as HTMLElement).dataset.shown = ""; io.unobserve(e.target); } }),
      { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
    );
    slots.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < stableViewportHeight() * 0.85 && r.bottom > 0) el.dataset.shown = "";
      else io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  // build the smooth S-curve that links node → node down the alternating timeline
  React.useEffect(() => {
    const root = timelineRef.current;
    if (!root) return;
    const build = () => {
      const slots = Array.from(root.querySelectorAll<HTMLElement>("[data-slot]"));
      if (slots.length < 2) { setConn(null); return; }
      const w = root.clientWidth, h = root.clientHeight;
      // anchor = each card's node center, derived from layout offsets (transform-free).
      // right card (i even): node on its inner/left edge; left card: inner/right edge.
      const pts = slots.map((slot, i) => {
        const right = i % 2 === 0;
        const x = right ? slot.offsetLeft : slot.offsetLeft + slot.offsetWidth;
        const y = slot.offsetTop + slot.offsetHeight / 2;
        return { x, y };
      });
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const my = (a.y + b.y) / 2; // control points at the vertical midpoint → soft S-curve
        d += ` C ${a.x.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${my.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
      setConn({ d, w, h });
      // mobile vertical rail: clamp it to span exactly first-node → last-node (it
      // otherwise ran the full timeline height, poking above the first node and past
      // the last). Offset-based so the cards' reveal transforms don't skew it.
      const dotCenter = (slot: HTMLElement) => {
        const c = slot.firstElementChild as HTMLElement | null; // the .connector dot
        return slot.offsetTop + (c ? c.offsetTop + c.offsetHeight / 2 : 0);
      };
      const railTop = dotCenter(slots[0]);
      const railBottom = h - dotCenter(slots[slots.length - 1]);
      root.style.setProperty("--rail-top", `${railTop.toFixed(1)}px`);
      root.style.setProperty("--rail-bottom", `${railBottom.toFixed(1)}px`);
    };
    build();
    const ro = new ResizeObserver(build);
    ro.observe(root);
    window.addEventListener("resize", build);
    const t = setTimeout(build, 400); // re-measure after fonts/layout settle
    return () => { ro.disconnect(); window.removeEventListener("resize", build); clearTimeout(t); };
  }, []);

  // draw the curved path with scroll progress (sets --p on the timeline; the SVG
  // draw-path reads it via stroke-dashoffset). Reduced motion → fully drawn.
  React.useEffect(() => {
    const root = timelineRef.current;
    if (!root) return;
    if (reduceMotion()) { root.style.setProperty("--p", "1"); return; }
    let raf = 0;
    let lastP = "";
    const update = () => {
      raf = 0;
      const r = root.getBoundingClientRect();
      const vh = stableViewportHeight();
      if (r.bottom < -vh * 0.2) {
        if (lastP !== "1") {
          root.style.setProperty("--p", "1");
          lastP = "1";
        }
        return;
      }
      if (r.top > vh * 1.2) {
        if (lastP !== "0") {
          root.style.setProperty("--p", "0");
          lastP = "0";
        }
        return;
      }
      const p = Math.max(0, Math.min(1, (vh * 0.6 - r.top) / (r.height || 1)));
      const next = p.toFixed(3);
      if (next !== lastP) {
        root.style.setProperty("--p", next);
        lastP = next;
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, []);

  return (
    <section id="agile" className={[s.panel, s.overlap].join(" ")} data-anim-pause style={{ background: "var(--page-bg)", color: "var(--ink-text)", overflow: "hidden", padding: "120px 0", position: "relative", zIndex: 5 }}>
      {/* Hero-style atmosphere: subtle star field + a very soft brand glow (no logo
          constellation, no fog/topology/meteors/aurora) — keeps Agile visually
          connected to the Hero but simpler. Both sit behind the content (z-index 1). */}
      <ScrollParallax max={48}><StarField /></ScrollParallax>
      {/* global journey: line arrives at the Agile title node, then GAPS (Agile's
          own internal line owns the middle), and resumes from the lower handoff
          node toward Contact */}
      <SectionConnector sectionKey="agile" enter="r" exit="l" gap />
      <div className={s.wrap} style={{ position: "relative", zIndex: 1 }}>
        {/* no side nodes on the Agile title — the global line hands off directly to
            the first Agile card's node (and out of the last card's node) instead */}
        <SectionHead nodeId="agile" nodeSides={false} tag="#AGILE_METHODOLOGY" light title="How we ship — calmly, every sprint" sub="A predictable rhythm from first conversation to production. Hover any stage to see what happens inside it." />
        <div className={ag.timeline} ref={timelineRef}>
          {/* mobile-only vertical rail: a single drawn line down the left, filled
              with the same --p scroll progress that draws the desktop curve */}
          <span className={ag.rail} aria-hidden="true"><span className={ag.railFill} /></span>
          {conn && (
            <svg className={ag.connSvg} width={conn.w} height={conn.h} viewBox={`0 0 ${conn.w} ${conn.h}`} fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="agileConnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#58ABCE" />
                  <stop offset="0.4" stopColor="#2A92CC" />
                  <stop offset="0.72" stopColor="#F4C65F" />
                  <stop offset="1" stopColor="#E2AA3B" />
                </linearGradient>
              </defs>
              {/* faint dotted full path — the "track" */}
              <path className={ag.connBase} d={conn.d} />
              {/* glowing path drawn with scroll progress */}
              <path className={ag.connDraw} d={conn.d} pathLength={1} stroke="url(#agileConnGrad)" />
            </svg>
          )}
          {AGILE.map((st, i) => {
            const right = i % 2 === 0; // 01 right, 02 left, 03 right, …
            // the global journey hands off into the Agile timeline: it lands on the
            // FIRST card's node, then (after the internal line) resumes from the LAST
            // card's node toward Contact.
            const nodeAttr = i === 0 ? "agile:r" : i === AGILE.length - 1 ? "agile:exitlow" : undefined;
            return (
              <div key={st.name} data-slot className={[ag.slot, right ? ag.right : ag.left].join(" ")}>
                <span className={ag.connector} data-node={nodeAttr} aria-hidden="true" />
                <AgilePanel st={st} i={i} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
