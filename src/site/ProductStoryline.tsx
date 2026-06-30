"use client";
import * as React from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import st from "./productStoryline.module.css";

/* ProductStoryline
 *
 * The Products section's OWN constellation route — separate from the global
 * SectionConnector (which still draws this section's slice of the page-wide
 * journey through the side lanes + title node). This one snakes vertically down
 * the EMPTY CENTRE GUTTER between the two product columns, dropping a glowing
 * node beside each product row.
 *
 * It owns the per-product reveal: as the drawn head reaches a row's node (the
 * node crossing the scroll reference line), it lights that node and flips the
 * row's `data-revealed`, which the CSS animates in. So "the storyline reaches the
 * node ⇒ the product reveals" is literally one mechanism. Reveal is once-only and
 * previous rows stay revealed.
 *
 * Draw is scroll-linked through a single rAF writing a MotionValue (no React
 * state per frame); the path's pathLength binds to it — same approach as
 * SectionConnector. It measures row centres in transform-independent layout space
 * (offsetTop), so the rows' own reveal transform never shifts the line off a node.
 *
 * Layering: the SVG sits at z-index 0 inside the (position:relative) list, above
 * the section background + global connector but below the rows (z-index 1). The
 * route stays inside a narrow central band, so it never crosses content; on
 * phones it drops into a thin left lane (rows are padded to clear it). */

type Pt = { x: number; y: number };
type Key = { y: number; fr: number };
type Seg = { p0: Pt; c1: Pt; c2: Pt; p3: Pt };

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

function interpKeys(keys: Key[], y: number): number {
  if (!keys.length) return 0;
  if (y <= keys[0].y) return keys[0].fr;
  for (let i = 1; i < keys.length; i++) {
    if (y <= keys[i].y) {
      const a = keys[i - 1], b = keys[i];
      const t = (y - a.y) / ((b.y - a.y) || 1);
      return a.fr + (b.fr - a.fr) * t;
    }
  }
  return keys[keys.length - 1].fr;
}

// smooth vertical snake through the points; control points pulled along Y so the
// curve bows gently between nodes (organic, never a straight ruler line).
function buildSnake(pts: Pt[]): { d: string; keys: Key[] } {
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  const segs: Seg[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const dy = b.y - a.y;
    const c1 = { x: a.x, y: a.y + dy * 0.42 };
    const c2 = { x: b.x, y: b.y - dy * 0.42 };
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    segs.push({ p0: a, c1, c2, p3: b });
  }
  const lens = segs.map(cubicLen);
  const total = lens.reduce((x, y) => x + y, 0) || 1;
  const keys: Key[] = [{ y: pts[0].y, fr: 0 }];
  let cum = 0, yprev = pts[0].y;
  for (let i = 0; i < segs.length; i++) {
    cum += lens[i];
    const y = Math.max(yprev + 1, segs[i].p3.y);
    keys.push({ y, fr: cum / total });
    yprev = y;
  }
  return { d, keys };
}

export function ProductStoryline({ count }: { count: number }) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const draw = useMotionValue(reduce ? 1 : 0);
  const [geo, setGeo] = React.useState<{ w: number; h: number; d: string; keys: Key[]; nodes: Pt[] }>({ w: 0, h: 0, d: "", keys: [], nodes: [] });

  const measure = React.useCallback(() => {
    const svg = svgRef.current;
    const list = svg?.parentElement as HTMLElement | null;
    if (!svg || !list) return;
    const w = list.clientWidth, h = list.clientHeight;
    if (!w || !h) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-pj-row]"));
    if (!rows.length) return;

    const mob = w < 768;
    // central gutter on desktop/tablet; a thin left lane on phones (rows are padded
    // to clear it). A small alternating bow keeps the route organic, never straight.
    const cx = mob ? Math.max(13, w * 0.045) : w * 0.5;
    // keep the bow inside the centre gutter at every width so the route never
    // drifts onto a content column (gutter narrows with the grid column-gap).
    const bow = mob ? 6 : Math.min(28, w * 0.018);
    const nodes: Pt[] = rows.map((row, i) => ({
      x: cx + (i % 2 === 1 ? bow : -bow),
      y: row.offsetTop + row.offsetHeight / 2,
    }));

    // start a little above the first node, end a little below the last
    const pts: Pt[] = [
      { x: nodes[0].x, y: Math.max(0, nodes[0].y - 90) },
      ...nodes,
      { x: nodes[nodes.length - 1].x, y: Math.min(h, nodes[nodes.length - 1].y + 90) },
    ];
    const { d, keys } = buildSnake(pts);
    setGeo({ w, h, d, keys, nodes });
  }, []);

  React.useLayoutEffect(() => {
    measure();
    let t = 0;
    const schedule = () => { window.clearTimeout(t); t = window.setTimeout(measure, 120); };
    const ro = new ResizeObserver(schedule);
    const list = svgRef.current?.parentElement;
    if (list) ro.observe(list);
    ro.observe(document.body);
    window.addEventListener("resize", schedule);
    const settle = window.setTimeout(measure, 600);
    return () => { ro.disconnect(); window.removeEventListener("resize", schedule); window.clearTimeout(t); window.clearTimeout(settle); };
  }, [measure]);

  // reveal-all fallback for reduced motion (the static full line is already drawn).
  React.useEffect(() => {
    if (!reduce) return;
    const list = svgRef.current?.parentElement;
    list?.querySelectorAll<HTMLElement>("[data-pj-row]").forEach((r) => r.setAttribute("data-revealed", ""));
  }, [reduce]);

  // scroll-linked draw + per-node reveal. One rAF, writes a MotionValue + toggles
  // data attributes only on change — no React state per frame.
  React.useEffect(() => {
    if (reduce) { draw.set(1); return; }
    const svg = svgRef.current;
    const list = svg?.parentElement as HTMLElement | null;
    if (!svg || !list || !geo.nodes.length) return;
    let raf = 0;
    const REF = 0.66; // viewport reference line the head draws toward
    const update = () => {
      raf = 0;
      const r = svg.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      draw.set(interpKeys(geo.keys, vh * REF - r.top));
      const rows = list.querySelectorAll<HTMLElement>("[data-pj-row]");
      const dots = svg.querySelectorAll<SVGGElement>("[data-pj-node]");
      for (let i = 0; i < geo.nodes.length; i++) {
        const reached = r.top + geo.nodes[i].y <= vh * REF;
        if (reached) {
          if (rows[i] && !rows[i].hasAttribute("data-revealed")) rows[i].setAttribute("data-revealed", "");
          if (dots[i] && !dots[i].hasAttribute("data-active")) dots[i].setAttribute("data-active", "");
        }
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduce, draw, geo.keys, geo.nodes]);

  return (
    <svg
      ref={svgRef}
      className={st.svg}
      viewBox={geo.w ? `0 0 ${geo.w} ${geo.h}` : undefined}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {geo.d && (
        <>
          <defs>
            <linearGradient id="pj-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#58abce" />
              <stop offset="0.55" stopColor="#7cc3ee" />
              <stop offset="1" stopColor="#e2aa3b" />
            </linearGradient>
          </defs>
          {reduce ? (
            <path className={st.path} d={geo.d} stroke="url(#pj-grad)" pathLength={1} />
          ) : (
            <motion.path className={st.path} d={geo.d} stroke="url(#pj-grad)" style={{ pathLength: draw }} />
          )}
          {geo.nodes.map((n, i) => (
            <g className={st.node} data-pj-node={i} key={i}>
              <circle className={st.halo} cx={n.x} cy={n.y} r={11} />
              <circle className={st.core} cx={n.x} cy={n.y} r={4.5} />
            </g>
          ))}
        </>
      )}
    </svg>
  );
}
