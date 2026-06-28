"use client";
import * as React from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import c from "./constellationJourney.module.css";
import { useJourneyActivate } from "./JourneyGate";

/* SectionConnector
 *
 * One small SVG per section that draws THIS section's slice of the constellation
 * journey. It lives INSIDE the section (or, for a sticky deck, inside the sticky
 * stage) as an absolutely-positioned layer at z-index -1 — above the section's
 * opaque background, below its decorative starfield and its content/title nodes.
 * So the line reads as part of the background; the glowing title nodes + activation
 * star (which live in the content) always sit on top.
 *
 * Because each connector measures the anchors it needs RELATIVE TO ITS OWN BOX,
 * sticky pinning never causes drift: the title node is a child of the same box,
 * so its local position is stable while the deck scrolls. Adjacent sections meet
 * because every section is the full viewport width and uses the same side-lane x.
 *
 * The line is routed only through the empty SIDE LANES (the margin outside the
 * max-width content column) and the title band, so it never crosses cards, text,
 * mockups or buttons. On mobile the lane sits past the viewport edge, so the line
 * exits one side and re-enters lower (clipped by the section's overflow — never a
 * horizontal scrollbar).
 *
 * Draw is scroll-linked via a single rAF handler writing to a MotionValue (no
 * React state per frame); the path's pathLength binds to it. Arrival (the drawn
 * head reaching the entry node) lights the node + star and calls onArrive once. */

type Side = "l" | "r";
export type ConnectorRole = "start" | "mid" | "end" | "pass";

type Props = {
  sectionKey: string;
  role?: ConnectorRole; // start = Hero origin, end = Contact (no exit), pass = About (no node), mid = normal
  enter?: Side; // side the incoming line lands on (the entry title node)
  exit?: Side; // side the outgoing line departs from
  gap?: boolean; // Agile: arrive at the title node, then GAP, resume from the lower handoff node
};

type Pt = { x: number; y: number };
type Seg = { p0: Pt; c1: Pt; c2: Pt; p3: Pt };

// where a vertical lane sits, by side + viewport width. Desktop/tablet hug the
// empty margin (on-screen); mobile pushes past the edge so the line exits/re-enters.
function laneX(side: Side, w: number): number {
  if (w < 768) return side === "l" ? -0.1 * w : 1.1 * w; // off the narrow edge (clipped)
  const inset = w >= 1440 ? 0.07 : w >= 1024 ? 0.085 : 0.1;
  return side === "l" ? Math.max(34, inset * w) : Math.min(w - 34, (1 - inset) * w);
}

function cubicLen(s: Seg): number {
  let len = 0, px = s.p0.x, py = s.p0.y;
  for (let k = 1; k <= 16; k++) {
    const t = k / 16, mt = 1 - t;
    const x = mt * mt * mt * s.p0.x + 3 * mt * mt * t * s.c1.x + 3 * mt * t * t * s.c2.x + t * t * t * s.p3.x;
    const y = mt * mt * mt * s.p0.y + 3 * mt * mt * t * s.c1.y + 3 * mt * t * t * s.c2.y + t * t * t * s.p3.y;
    len += Math.hypot(x - px, y - py); px = x; py = y;
  }
  return len;
}

export function SectionConnector({ sectionKey, role = "mid", enter, exit, gap }: Props) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const onArrive = useJourneyActivate();
  const draw = useMotionValue(reduce ? 1 : 0);

  // geometry, measured on mount/resize only (never per scroll frame).
  // nodeY = the entry node's local y (for arrival timing), maxY = the path's
  // lowest point (for draw progress). Both decouple arrival/draw from the section's
  // total height, which is huge for the sticky decks.
  const [geo, setGeo] = React.useState<{ w: number; h: number; d: string; nodeY: number | null; maxY: number }>({ w: 0, h: 0, d: "", nodeY: null, maxY: 1 });
  const firedRef = React.useRef(false);

  const measure = React.useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const w = box.width, h = box.height;
    if (!w || !h) return;
    const local = (sel: string): Pt | null => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top };
    };
    const node = (side: Side) => local(`[data-node="${sectionKey}:${side}"]`);

    const segs: Seg[] = [];
    const push = (a: Pt, c1: Pt, c2: Pt, b: Pt) => segs.push({ p0: a, c1, c2, p3: b });
    const arc = w >= 768 ? 42 : 28; // over-title bow height
    let dGap = false; // a moveto was inserted (Agile gap) → record where to break length accounting
    let nodeY: number | null = null; // entry-node local y (arrival timing)

    // --- build this section's piece ---
    if (role === "start") {
      // Hero: from the origin star down to the bottom edge in the exit lane
      const star = local('[data-node="hero:star"]');
      const ex = laneX(exit ?? "l", w);
      if (!star) return;
      const end = { x: ex, y: h };
      push(star, { x: star.x, y: star.y + (end.y - star.y) * 0.4 }, { x: ex, y: end.y - (end.y - star.y) * 0.4 }, end);
    } else if (role === "pass") {
      // About: a straight side-lane pass-through (no node), entering & leaving the same side
      const lx = laneX(enter ?? "l", w);
      push({ x: lx, y: 0 }, { x: lx, y: h * 0.34 }, { x: lx, y: h * 0.66 }, { x: lx, y: h });
    } else {
      // mid / end: incoming (top lane → entry node) [+ over-title → exit node → bottom lane]
      const en = enter ? node(enter) : null;
      if (enter && !en) return; // entry node not measurable yet
      if (en) {
        const lx = laneX(enter as Side, w);
        const top = { x: lx, y: 0 };
        push(top, { x: lx, y: en.y * 0.45 }, { x: en.x, y: en.y * 0.7 }, en);
        nodeY = en.y;
      }
      if (role !== "end") {
        if (gap) {
          // Agile: pen lifts off the title; resume from the lower handoff node
          const low = local(`[data-node="${sectionKey}:exitlow"]`);
          const ex = laneX(exit ?? "l", w);
          if (low) {
            dGap = true;
            const end = { x: ex, y: h };
            push(low, { x: low.x, y: low.y + (end.y - low.y) * 0.4 }, { x: ex, y: end.y - (end.y - low.y) * 0.4 }, end);
          }
        } else if (exit) {
          const ex = node(exit);
          const exX = laneX(exit, w);
          if (ex && en) {
            // over the title to the exit node, then down to the bottom edge lane
            push(en, { x: en.x, y: en.y - arc }, { x: ex.x, y: ex.y - arc }, ex);
            const end = { x: exX, y: h };
            push(ex, { x: ex.x, y: ex.y + (end.y - ex.y) * 0.4 }, { x: exX, y: end.y - (end.y - ex.y) * 0.4 }, end);
          }
        }
      }
    }

    if (!segs.length) return;

    // build d (insert a moveto before the gap-resume segment)
    let d = `M ${segs[0].p0.x.toFixed(1)} ${segs[0].p0.y.toFixed(1)}`;
    let gapIndex = -1;
    let maxY = 1;
    if (dGap) gapIndex = segs.length - 1; // the last segment is the resume leg
    segs.forEach((g, i) => {
      if (i === gapIndex) d += ` M ${g.p0.x.toFixed(1)} ${g.p0.y.toFixed(1)}`;
      d += ` C ${g.c1.x.toFixed(1)} ${g.c1.y.toFixed(1)}, ${g.c2.x.toFixed(1)} ${g.c2.y.toFixed(1)}, ${g.p3.x.toFixed(1)} ${g.p3.y.toFixed(1)}`;
      maxY = Math.max(maxY, g.p0.y, g.p3.y);
    });
    setGeo({ w, h, d, nodeY, maxY });
  }, [sectionKey, role, enter, exit, gap]);

  React.useLayoutEffect(() => {
    measure();
    let t = 0;
    const schedule = () => { window.clearTimeout(t); t = window.setTimeout(measure, 120); };
    const ro = new ResizeObserver(schedule);
    if (svgRef.current) ro.observe(svgRef.current);
    ro.observe(document.body);
    window.addEventListener("resize", schedule);
    const settle = window.setTimeout(measure, 600);
    return () => { ro.disconnect(); window.removeEventListener("resize", schedule); window.clearTimeout(t); window.clearTimeout(settle); };
  }, [measure]);

  // scroll-linked draw: progress of THIS section through the viewport → pathLength.
  // One rAF-throttled handler, writes a MotionValue (no React state per frame).
  const fire = React.useCallback(() => {
    if (firedRef.current || role === "start" || role === "pass" || !enter) return;
    firedRef.current = true;
    document.querySelector(`[data-node="${sectionKey}:${enter}"]`)?.setAttribute("data-active", "");
    document.querySelector(`[data-star="${sectionKey}"]`)?.setAttribute("data-active", "");
    onArrive?.(sectionKey);
  }, [sectionKey, role, enter, onArrive]);

  React.useEffect(() => {
    if (reduce) { draw.set(1); fire(); return; }
    const svg = svgRef.current;
    if (!svg) return;
    let raf = 0;
    const clamp = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
    const REF = 0.62; // viewport reference line the line "draws to"
    const update = () => {
      raf = 0;
      const r = svg.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // draw proportional to how far the reference line has descended through the
      // path's vertical extent (independent of the section's huge total height).
      draw.set(clamp((vh * REF - r.top) / geo.maxY));
      // arrival fires on the ENTRY NODE's own screen position — robust for the tall
      // sticky decks where the title is pinned, decoupled from path length.
      if (geo.nodeY != null && r.top + geo.nodeY <= vh * REF) fire();
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduce, draw, geo.maxY, geo.nodeY, fire]);

  return (
    <svg
      ref={svgRef}
      className={c.sectionSvg}
      viewBox={geo.w ? `0 0 ${geo.w} ${geo.h}` : undefined}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {geo.d && (
        <>
          <defs>
            <linearGradient id={`cjg-${sectionKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7cc3ee" />
              <stop offset="0.5" stopColor="#3f9bdc" />
              <stop offset="1" stopColor="#5ab0d0" />
            </linearGradient>
          </defs>
          {reduce ? (
            <path className={c.draw} d={geo.d} stroke={`url(#cjg-${sectionKey})`} pathLength={1} />
          ) : (
            <motion.path className={c.draw} d={geo.d} stroke={`url(#cjg-${sectionKey})`} style={{ pathLength: draw }} />
          )}
        </>
      )}
    </svg>
  );
}
