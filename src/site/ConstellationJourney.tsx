"use client";
import * as React from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from "motion/react";
import c from "./constellationJourney.module.css";

/* ConstellationJourney
 *
 * ONE page-wide overlay line that travels from the Hero star through every
 * section's title node, entering/exiting from explicitly-declared alternating
 * sides (a strict zig-zag). The SVG is full-page + overflow-visible so the legs
 * may hug — and on mobile briefly leave — the viewport edge; the page keeps
 * overflow-x:hidden so this never makes a horizontal scrollbar.
 *
 * Geometry (Hero star + each section's l/r title nodes) is measured ONLY on mount
 * and on resize/layout changes (debounced ResizeObserver), never per scroll frame.
 * The path is drawn with a single useScroll → useTransform (MotionValue pathLength)
 * so scrolling does NOT trigger React re-renders. Per-anchor path-length fractions
 * are computed from the real cubic geometry (sampled), so the drawn head, the
 * flowing light, and the arrival triggers all stay in sync. When the head reaches
 * a section's entry node we light that node + its star (toggling data-active
 * directly on the DOM, no re-render) and call onArrive(key) once. */

type Side = "l" | "r";
type Section = { key: string; enter: Side; exit: Side };

type Anchor = { x: number; y: number; key: string; kind: "hero" | "enter" | "exit"; nodeSel?: string };
type Pt = { x: number; y: number };
type Seg = { p0: Pt; c1: Pt; c2: Pt; p3: Pt };

/* The horizontal extreme (apex) an inter-section leg bows toward, by viewport
 * width. Larger screens swing strongest; the apex is always clamped to stay a
 * comfortable margin INSIDE the viewport so no part of the leg is clipped and the
 * line never appears to vanish between sections. `navg` is the average x of the
 * leg's two endpoints; the bow reaches `reach·w` toward the nearer edge from it. */
function legApexX(navg: number, side: "left" | "right", w: number) {
  const reach = w >= 1440 ? 0.14 : w >= 1024 ? 0.11 : w >= 768 ? 0.08 : 0.05;
  const raw = side === "left" ? navg - reach * w : navg + reach * w;
  const margin = w >= 768 ? 26 : 12; // keep the whole curve on-screen
  return Math.max(margin, Math.min(w - margin, raw));
}

// length of a cubic Bézier by light sampling (done once per measure, not per frame)
function cubicLen(s: Seg) {
  let len = 0, px = s.p0.x, py = s.p0.y;
  const N = 18;
  for (let k = 1; k <= N; k++) {
    const t = k / N, mt = 1 - t;
    const x = mt * mt * mt * s.p0.x + 3 * mt * mt * t * s.c1.x + 3 * mt * t * t * s.c2.x + t * t * t * s.p3.x;
    const y = mt * mt * mt * s.p0.y + 3 * mt * mt * t * s.c1.y + 3 * mt * t * t * s.c2.y + t * t * t * s.p3.y;
    len += Math.hypot(x - px, y - py);
    px = x; py = y;
  }
  return len;
}

export function ConstellationJourney({ sections, onArrive }: { sections: Section[]; onArrive: (key: string) => void }) {
  const layerRef = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const [geo, setGeo] = React.useState<{ w: number; h: number; d: string; anchors: Anchor[]; fr: number[]; sp: number[] }>({
    w: 0, h: 0, d: "", anchors: [], fr: [], sp: [],
  });

  const measure = React.useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const w = layer.clientWidth;
    const h = document.body.scrollHeight;
    if (!w || !h) return;
    const layerTop = layer.getBoundingClientRect().top + window.scrollY;

    const ptOf = (sel: string): Pt | null => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 + window.scrollY - layerTop };
    };

    const hero = ptOf('[data-node="hero:star"]');
    if (!hero) return;

    // ordered anchor list: hero, then for each section its entry then exit node
    // (the last section has no outgoing leg → no exit anchor).
    const anchors: Anchor[] = [{ ...hero, key: "hero", kind: "hero" }];
    sections.forEach((sec, si) => {
      const enterPt = ptOf(`[data-node="${sec.key}:${sec.enter}"]`);
      if (!enterPt) return;
      anchors.push({ ...enterPt, key: sec.key, kind: "enter", nodeSel: `[data-node="${sec.key}:${sec.enter}"]` });
      if (si < sections.length - 1) {
        const exitPt = ptOf(`[data-node="${sec.key}:${sec.exit}"]`);
        if (exitPt) anchors.push({ ...exitPt, key: sec.key, kind: "exit" });
      }
    });
    if (anchors.length < 2) return;

    // build the path + keep each segment's control points so we can measure real
    // length. over-title legs (enter→exit, same key) bow up over the title; every
    // other leg hugs the nearer screen edge.
    const arcUp = w >= 768 ? 42 : 30;
    const segs: Seg[] = [];
    let d = `M ${anchors[0].x.toFixed(1)} ${anchors[0].y.toFixed(1)}`;
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1], b = anchors[i];
      const overTitle = a.kind === "enter" && b.kind === "exit" && a.key === b.key;
      let c1: Pt, c2: Pt;
      if (overTitle) {
        c1 = { x: a.x, y: a.y - arcUp };
        c2 = { x: b.x, y: b.y - arcUp };
      } else {
        const navg = (a.x + b.x) / 2;
        const side: "left" | "right" = navg < w / 2 ? "left" : "right";
        const apex = legApexX(navg, side, w);
        // symmetric cubic: apex_x = 0.25*navg + 0.75*cx  →  cx places the bulge apex
        const cx = (apex - 0.25 * navg) / 0.75;
        const dy = b.y - a.y;
        c1 = { x: cx, y: a.y + dy * 0.35 };
        c2 = { x: cx, y: b.y - dy * 0.35 };
      }
      segs.push({ p0: { x: a.x, y: a.y }, c1, c2, p3: { x: b.x, y: b.y } });
      d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }

    // real per-anchor cumulative length → fractions (draw, light + arrivals align)
    const cum = [0];
    for (let i = 0; i < segs.length; i++) cum.push(cum[i] + cubicLen(segs[i]) + 0.001);
    const total = cum[cum.length - 1] || 1;
    const fr = cum.map((v) => v / total);

    // scroll-progress trigger per anchor: a node is "reached" as its section nears
    // the upper-middle of the viewport. Y-anchored points (hero + each entry) come
    // from layout; exit anchors are interpolated in length-space between their
    // surrounding entries so the over-title arc + outgoing leg draw at a steady
    // pace (no snapping). Forced strictly increasing.
    const vh = window.innerHeight || 1;
    const docScroll = Math.max(1, (document.documentElement.scrollHeight || h) - vh);
    const spBase: (number | null)[] = anchors.map((an) => {
      if (an.kind === "exit") return null;
      return Math.max(0, Math.min(1, (an.y + layerTop - vh * 0.62) / docScroll));
    });
    let prev = -1;
    for (let i = 0; i < spBase.length; i++) {
      if (spBase[i] == null) continue;
      if ((spBase[i] as number) <= prev) spBase[i] = Math.min(1, prev + 0.001);
      prev = spBase[i] as number;
    }
    const sp = spBase.map((v, i) => {
      if (v != null) return v;
      let p = i - 1; while (p >= 0 && spBase[p] == null) p--;
      let n = i + 1; while (n < spBase.length && spBase[n] == null) n++;
      if (p < 0) return spBase[n] as number;
      if (n >= spBase.length) return spBase[p] as number;
      const t = (fr[i] - fr[p]) / ((fr[n] - fr[p]) || 1);
      return (spBase[p] as number) + ((spBase[n] as number) - (spBase[p] as number)) * t;
    });
    // final strictly-increasing guard
    for (let i = 1; i < sp.length; i++) if (sp[i] <= sp[i - 1]) sp[i] = Math.min(1, sp[i - 1] + 0.0005);

    setGeo({ w, h, d, anchors, fr, sp });
  }, [sections]);

  // measure on mount + on layout changes (debounced so reveal-driven height
  // changes don't trigger a measure storm).
  React.useLayoutEffect(() => {
    measure();
    let t = 0;
    const schedule = () => { window.clearTimeout(t); t = window.setTimeout(measure, 120); };
    const ro = new ResizeObserver(schedule);
    if (layerRef.current) ro.observe(layerRef.current);
    ro.observe(document.body);
    window.addEventListener("resize", schedule);
    const settle = window.setTimeout(measure, 600); // re-measure after fonts/layout settle
    return () => { ro.disconnect(); window.removeEventListener("resize", schedule); window.clearTimeout(t); window.clearTimeout(settle); };
  }, [measure]);

  const { scrollYProgress } = useScroll();
  const sp = geo.sp.length >= 2 ? geo.sp : [0, 1];
  const fr = geo.fr.length >= 2 ? geo.fr : [0, 1];
  const draw = useTransform(scrollYProgress, sp, fr);

  // arrivals: light the entry node + star and fire onArrive once each
  const firedRef = React.useRef<Set<string>>(new Set());
  const enterCount = React.useMemo(() => geo.anchors.filter((a) => a.kind === "enter").length, [geo.anchors]);
  const checkArrivals = React.useCallback((v: number) => {
    if (firedRef.current.size >= enterCount && enterCount > 0) return; // all done — idle
    geo.anchors.forEach((an, i) => {
      if (an.kind !== "enter" || firedRef.current.has(an.key)) return;
      if (v >= geo.fr[i] - 0.001) {
        firedRef.current.add(an.key);
        if (an.nodeSel) document.querySelector(an.nodeSel)?.setAttribute("data-active", "");
        document.querySelector(`[data-star="${an.key}"]`)?.setAttribute("data-active", "");
        onArrive(an.key);
      }
    });
  }, [geo.anchors, geo.fr, enterCount, onArrive]);
  useMotionValueEvent(draw, "change", checkArrivals);
  React.useEffect(() => { checkArrivals(draw.get()); }, [checkArrivals, draw]);

  const ready = geo.w > 0 && geo.d;

  return (
    <div ref={layerRef} className={c.layer} aria-hidden="true">
      {ready && (
        <svg className={c.svg} width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} fill="none">
          <defs>
            <linearGradient id="cjGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7cc3ee" />
              <stop offset="0.5" stopColor="#3f9bdc" />
              <stop offset="1" stopColor="#5ab0d0" />
            </linearGradient>
          </defs>
          <path className={c.base} d={geo.d} />
          {reduce ? (
            <path className={c.draw} d={geo.d} stroke="url(#cjGrad)" pathLength={1} />
          ) : (
            <motion.path className={c.draw} d={geo.d} stroke="url(#cjGrad)" style={{ pathLength: draw }} />
          )}
        </svg>
      )}
    </div>
  );
}
