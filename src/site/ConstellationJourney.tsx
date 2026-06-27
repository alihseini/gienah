"use client";
import * as React from "react";
import { motion, useScroll, useTransform, useMotionValueEvent, useReducedMotion } from "motion/react";
import c from "./constellationJourney.module.css";

/* ConstellationJourney
 *
 * ONE page-wide overlay line that travels from the Hero star through every
 * section's title node, entering/exiting from alternating sides (zig-zag). The
 * SVG is full-page + overflow-visible so curves may leave and re-enter the
 * viewport (the page keeps overflow-x:hidden → never a horizontal scrollbar).
 *
 * Positions of the Hero star (data-node="hero:star") and the section title nodes
 * (data-node="<key>:l|r") are measured ONLY on mount + resize (ResizeObserver),
 * never per scroll frame. The path is drawn with a single useScroll → useTransform
 * (MotionValue pathLength), so scrolling does NOT trigger React re-renders. When
 * the drawn head reaches a section's entry node we light that node + its star
 * (toggling data-active directly on the DOM, no re-render) and call onArrive(key)
 * once so the section's reveal can run. */

type Section = { key: string; enter: "l" | "r" }; // exit is the opposite side

type Anchor = { x: number; y: number; key: string; kind: "hero" | "enter" | "exit"; nodeSel?: string };

function sideOutFor(w: number) {
  if (w >= 1440) return w * 0.42;
  if (w >= 1024) return w * 0.34;
  if (w >= 768) return w * 0.28;
  return w * 0.5; // mobile: push well past the narrow edge so the line leaves/re-enters
}

export function ConstellationJourney({ sections, onArrive }: { sections: Section[]; onArrive: (key: string) => void }) {
  const layerRef = React.useRef<HTMLDivElement>(null);
  const pathRef = React.useRef<SVGPathElement>(null);
  const reduce = useReducedMotion();

  const [geo, setGeo] = React.useState<{ w: number; h: number; d: string; anchors: Anchor[]; fr: number[]; sp: number[] }>({
    w: 0, h: 0, d: "", anchors: [], fr: [], sp: [],
  });

  const measure = React.useCallback(() => {
    const layer = layerRef.current;
    if (!layer) return;
    const w = layer.clientWidth;
    const h = layer.scrollHeight || document.body.scrollHeight;
    if (!w || !h) return;
    const layerTop = layer.getBoundingClientRect().top + window.scrollY;

    const ptOf = (sel: string): { x: number; y: number } | null => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 + window.scrollY - layerTop };
    };

    const hero = ptOf('[data-node="hero:star"]');
    if (!hero) return;
    const anchors: Anchor[] = [{ ...hero, key: "hero", kind: "hero" }];
    for (const s of sections) {
      const exit = s.enter === "l" ? "r" : "l";
      const enterPt = ptOf(`[data-node="${s.key}:${s.enter}"]`);
      const exitPt = ptOf(`[data-node="${s.key}:${exit}"]`);
      if (!enterPt) continue;
      anchors.push({ ...enterPt, key: s.key, kind: "enter", nodeSel: `[data-node="${s.key}:${s.enter}"]` });
      // last section has no outgoing leg, but keep its exit anchor only if present + not last
      if (exitPt && s !== sections[sections.length - 1]) {
        anchors.push({ ...exitPt, key: s.key, kind: "exit" });
      }
    }
    if (anchors.length < 2) return;

    // build the path: over-title arcs (enter→exit, same key) bow up toward the star;
    // side legs bow out toward the nearer screen edge
    const out = sideOutFor(w);
    const arcUp = w >= 768 ? 40 : 30;
    let d = `M ${anchors[0].x.toFixed(1)} ${anchors[0].y.toFixed(1)}`;
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1], b = anchors[i];
      const overTitle = a.kind === "enter" && b.kind === "exit" && a.key === b.key;
      if (overTitle) {
        const up = Math.min(arcUp, 60);
        d += ` C ${a.x.toFixed(1)} ${(a.y - up).toFixed(1)}, ${b.x.toFixed(1)} ${(b.y - up).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      } else {
        const dy = b.y - a.y;
        const side = (a.x + b.x) / 2 >= w / 2 ? 1 : -1;
        const o = out * side;
        d += ` C ${(a.x + o).toFixed(1)} ${(a.y + dy * 0.35).toFixed(1)}, ${(b.x + o).toFixed(1)} ${(b.y - dy * 0.35).toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
      }
    }

    // approximate per-anchor length fractions (chord-based) for arrivals + draw map
    const cum = [0];
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1], b = anchors[i];
      cum.push(cum[i - 1] + Math.hypot(b.x - a.x, b.y - a.y) + 1);
    }
    const total = cum[cum.length - 1] || 1;
    const fr = cum.map((v) => v / total);

    // scroll-progress trigger point per anchor (line reaches a node as its section
    // nears the upper-middle of the viewport). Forced strictly increasing.
    const vh = window.innerHeight || 1;
    const docScroll = Math.max(1, (document.documentElement.scrollHeight || h) - vh);
    let prev = -1;
    const sp = anchors.map((an) => {
      let v = (an.y + layerTop - vh * 0.62) / docScroll;
      v = Math.max(0, Math.min(1, v));
      if (v <= prev) v = Math.min(1, prev + 0.0001);
      prev = v;
      return v;
    });

    setGeo({ w, h, d, anchors, fr, sp });
  }, [sections]);

  React.useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(() => requestAnimationFrame(measure));
    if (layerRef.current) ro.observe(layerRef.current);
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    const t = setTimeout(measure, 600); // re-measure after fonts/layout settle
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); clearTimeout(t); };
  }, [measure]);

  const { scrollYProgress } = useScroll();
  // map the page scroll to draw progress through the measured anchor points
  const sp = geo.sp.length >= 2 ? geo.sp : [0, 1];
  const fr = geo.fr.length >= 2 ? geo.fr : [0, 1];
  const draw = useTransform(scrollYProgress, sp, fr);

  // flowing light position along the path
  const lenRef = React.useRef(1);
  React.useLayoutEffect(() => { if (pathRef.current) lenRef.current = pathRef.current.getTotalLength() || 1; }, [geo.d]);
  const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lx = useTransform(draw, (v) => (pathRef.current ? pathRef.current.getPointAtLength(clamp(v) * lenRef.current).x : 0));
  const ly = useTransform(draw, (v) => (pathRef.current ? pathRef.current.getPointAtLength(clamp(v) * lenRef.current).y : 0));
  const lightOpacity = useTransform(draw, [0, 0.02, 0.985, 1], [0, 1, 1, 0]);

  // arrivals: when the drawn head passes a section's entry-node fraction, light its
  // node + star and fire onArrive once
  const firedRef = React.useRef<Set<string>>(new Set());
  const checkArrivals = React.useCallback((v: number) => {
    geo.anchors.forEach((an, i) => {
      if (an.kind !== "enter" || firedRef.current.has(an.key)) return;
      if (v >= geo.fr[i] - 0.001) {
        firedRef.current.add(an.key);
        if (an.nodeSel) document.querySelector(an.nodeSel)?.setAttribute("data-active", "");
        document.querySelector(`[data-star="${an.key}"]`)?.setAttribute("data-active", "");
        onArrive(an.key);
      }
    });
  }, [geo.anchors, geo.fr, onArrive]);
  useMotionValueEvent(draw, "change", checkArrivals);
  // also fire immediately for anything already passed (deep-link / refresh mid-page)
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
            <>
              <motion.path ref={pathRef} className={c.draw} d={geo.d} stroke="url(#cjGrad)" style={{ pathLength: draw }} />
              <motion.g style={{ x: lx, y: ly, opacity: lightOpacity }}>
                <circle className={c.light} r={3} cx={0} cy={0} />
              </motion.g>
            </>
          )}
        </svg>
      )}
    </div>
  );
}
