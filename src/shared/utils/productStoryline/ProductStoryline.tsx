"use client";
import * as React from "react";
import { motion, useMotionValue, useReducedMotion } from "motion/react";
import st from "./productStoryline.module.css";

/* ProductStoryline
 *
 * The Products section's own constellation route — a single organic SVG path made
 * entirely of cubic Béziers (no rectangular L-turns), drawn progressively with
 * scroll, exactly like the rest of Gienah's journey connectors.
 *
 * Route: it starts AT the title's left constellation node, curves down into the
 * first product's node (which sits just outside that visual, on the side away from
 * the text), then flows in alternating S-curves to each next product's node on the
 * opposite side. Every node is a point ON the path. The wire only travels
 * vertically in the empty outer gutter beside a product visual and curves across
 * the empty gap between two rows, so it never crosses a visual, text or buttons.
 *
 * Timing: draw is a single MotionValue mapped LINEARLY to scroll (not to the head's
 * y), so each path segment — including the long side-to-side curves — gets scroll
 * time proportional to its real arc length, and the travel between products reads
 * as continuous/cinematic instead of snapping. Each product's reveal is gated on
 * the DRAWN length passing that node's own fraction along the path: the node lights
 * the instant the stroke reaches it, then the product animates in. Once-only.
 *
 * Layering: SVG at z-index 0 inside the (position:relative) list — above the
 * background + global connector, below the rows (z-index 1). Mobile collapses to a
 * gentle vertical line in a thin left lane (rows padded to clear it). */

type Pt = { x: number; y: number };
type Seg = { p0: Pt; c1: Pt; c2: Pt; p3: Pt };

const f = (n: number) => n.toFixed(1);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function cubicLen(s: Seg): number {
  let len = 0, px = s.p0.x, py = s.p0.y;
  for (let k = 1; k <= 18; k++) {
    const t = k / 18, mt = 1 - t;
    const x = mt * mt * mt * s.p0.x + 3 * mt * mt * t * s.c1.x + 3 * mt * t * t * s.c2.x + t * t * t * s.p3.x;
    const y = mt * mt * mt * s.p0.y + 3 * mt * mt * t * s.c1.y + 3 * mt * t * t * s.c2.y + t * t * t * s.p3.y;
    len += Math.hypot(x - px, y - py); px = x; py = y;
  }
  return len;
}

// Turn a start point + cubic segments into a path string + each product node's
// fraction along the total length (nodeBoundary[i] = how many segments are drawn
// once node i has been reached).
function finalize(start: Pt, segs: Seg[], nodeBoundary: number[]): { d: string; nodeFracs: number[] } {
  let d = `M ${f(start.x)} ${f(start.y)}`;
  const cum = [0];
  let total = 0;
  for (const s of segs) {
    d += ` C ${f(s.c1.x)} ${f(s.c1.y)}, ${f(s.c2.x)} ${f(s.c2.y)}, ${f(s.p3.x)} ${f(s.p3.y)}`;
    total += cubicLen(s);
    cum.push(total);
  }
  total = total || 1;
  return { d, nodeFracs: nodeBoundary.map((b) => cum[b] / total) };
}

// Desktop/tablet alternating timeline. Two cubics per node→node move: the first
// leaves the node straight DOWN (a long vertical handle hugs the gutter past the
// visual), curves into a sway point sitting in the empty inter-row gap; the second
// leaves that gap point and arrives at the next node straight DOWN its gutter. All
// curves, no corners; a small alternating sway keeps it asymmetric/organic.
function buildDesktop(start: Pt, nodes: Pt[], mockHalf: number, h: number, bridge: Pt | null): { d: string; nodeFracs: number[] } {
  const segs: Seg[] = [];
  const hv = mockHalf + 30;               // vertical hug past a visual before curving
  const n0 = nodes[0];
  // lead-in from the title node: pull into node 0's lane while descending so it
  // clears the first visual, landing vertically on the node.
  segs.push({
    p0: start,
    c1: { x: n0.x, y: start.y + (n0.y - start.y) * 0.5 },
    c2: { x: n0.x, y: n0.y - Math.max(40, (n0.y - start.y) * 0.16) },
    p3: n0,
  });
  const nodeBoundary = [segs.length]; // node 0 reached
  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i], b = nodes[i + 1];
    const dx = b.x - a.x;
    const mid = (a.y + b.y) / 2;
    const sway = (i % 2 ? -1 : 1) * Math.min(46, Math.abs(dx) * 0.05);
    const gm: Pt = { x: (a.x + b.x) / 2 + sway, y: mid };
    // a → gap-mid: down the gutter, then curve across into the gap
    segs.push({ p0: a, c1: { x: a.x, y: a.y + hv }, c2: { x: gm.x - dx * 0.16, y: gm.y - 6 }, p3: gm });
    // gap-mid → b: curve out of the gap, then straight down the next gutter to b
    segs.push({ p0: gm, c1: { x: gm.x + dx * 0.16, y: gm.y + 6 }, c2: { x: b.x, y: b.y - hv }, p3: b });
    nodeBoundary.push(segs.length); // node i+1 reached
  }
  const nl = nodes[nodes.length - 1];
  if (bridge) {
    // hand-off: flow from the last node, curve through the empty space below the
    // last row, and arrive (vertically) at the next section's entry lane on the
    // section's bottom edge — so the Products wire continues seamlessly into the
    // "More from the studio" connector, which enters that exact lane.
    // ONE smooth cubic from the last node to the hand-off point — no mid waypoint,
    // so there are no pointy corners. It leaves the node straight down (continuous
    // with the storyline) and arrives straight down into the hand-off (continuous
    // with the studio drop), curving softly from the right gutter across to the
    // target in between — a single flowing constellation arc.
    const span = bridge.y - nl.y;
    segs.push({
      p0: nl,
      c1: { x: nl.x, y: nl.y + span * 0.52 },
      c2: { x: bridge.x, y: bridge.y - span * 0.3 },
      p3: bridge,
    });
  } else {
    const tailY = Math.min(h, nl.y + 110);
    segs.push({ p0: nl, c1: { x: nl.x, y: nl.y + 50 }, c2: { x: nl.x + 8, y: tailY - 24 }, p3: { x: nl.x, y: tailY } });
  }
  return finalize(start, segs, nodeBoundary);
}

// Mobile left-lane line: a gentle organic vertical bow through the nodes, then a
// soft curve out to the next section's entry lane (bridge) so the wire continues
// off the left edge into the studio connector exactly as on desktop.
function buildMobile(nodes: Pt[], h: number, bridge: Pt | null): { d: string; nodeFracs: number[] } {
  const end: Pt = bridge ?? { x: nodes[nodes.length - 1].x, y: Math.min(h, nodes[nodes.length - 1].y + 80) };
  const pts: Pt[] = [
    { x: nodes[0].x, y: Math.max(0, nodes[0].y - 80) },
    ...nodes,
    end,
  ];
  const segs: Seg[] = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], dy = b.y - a.y;
    segs.push({ p0: a, c1: { x: a.x, y: a.y + dy * 0.45 }, c2: { x: b.x, y: b.y - dy * 0.45 }, p3: b });
  }
  // node i is p3 of segment i (0-based) → boundary i + 1
  return finalize(pts[0], segs, nodes.map((_, i) => i + 1));
}

export function ProductStoryline({ count }: { count: number }) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const draw = useMotionValue(reduce ? 1 : 0);
  const [geo, setGeo] = React.useState<{ w: number; h: number; d: string; nodeFracs: number[]; nodes: Pt[] }>({ w: 0, h: 0, d: "", nodeFracs: [], nodes: [] });

  const measure = React.useCallback(() => {
    const svg = svgRef.current;
    const list = svg?.parentElement as HTMLElement | null;
    if (!svg || !list) return;
    const w = list.clientWidth, h = list.clientHeight;
    if (!w || !h) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-pj-row]"));
    if (!rows.length) return;
    const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const mob = w < 768;
    const docPos = (el: HTMLElement) => {
      let x = 0, y = 0, n: HTMLElement | null = el;
      while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return { x, y };
    };
    const lp = docPos(list);

    // Hand-off point into the next section ("More from the studio"). Sections are
    // flush, so that section's top edge IS this section's bottom edge. We end the
    // wire on this section's bottom edge directly ABOVE the studio LEFT title node,
    // so it flows straight down into the studio connector (which uses enterTop, a
    // drop onto that node) as one continuous line — no detour out to the side lane.
    // On phones the studio connector still enters from the off-screen side lane, so
    // there we target that lane instead. secBottom converts section→pjList y; the
    // studio node / lane give the x in the storyline SVG's space.
    const section = list.closest("section") as HTMLElement | null;
    let bridge: Pt | null = null;
    if (section) {
      const sp = docPos(section);
      const secW = section.offsetWidth;
      const inset = secW >= 1440 ? 0.07 : secW >= 1024 ? 0.085 : 0.1;
      const secBottomLocal = sp.y + section.offsetHeight - lp.y;
      const studioL = document.querySelector<HTMLElement>('[data-node="studio:l"]');
      if (!mob && studioL) {
        bridge = { x: docPos(studioL).x + studioL.offsetWidth / 2 - lp.x, y: secBottomLocal + 2 };
      } else {
        const laneL = secW < 768 ? -0.1 * secW : Math.max(34, inset * secW);
        bridge = { x: laneL - (lp.x - sp.x), y: secBottomLocal + 2 };
      }
    }

    if (mob) {
      const cx = Math.max(13, w * 0.045);
      const nodes: Pt[] = rows.map((row, i) => ({ x: cx + (i % 2 ? 6 : -6), y: row.offsetTop + row.offsetHeight / 2 }));
      const { d, nodeFracs } = buildMobile(nodes, h, bridge);
      setGeo({ w, h, d, nodeFracs, nodes });
      return;
    }

    // node sits just outside each product visual, on the side away from the text,
    // measured from the visual box in transform-independent layout space so
    // the rows' reveal transforms never shift the line off a node.
    const GAP = 28;
    let mockHalf = 200;
    const nodes: Pt[] = rows.map((row, i) => {
      const m = (row.querySelector<HTMLElement>("[data-pj-media]") ?? row);
      const mp = docPos(m);
      const mx = mp.x - lp.x, my = mp.y - lp.y;
      mockHalf = m.offsetHeight / 2;
      const reverse = i % 2 === 1; // visual on the right
      const nx = reverse ? mx + m.offsetWidth + GAP : mx - GAP;
      return { x: clamp(nx, 16, w - 16), y: my + m.offsetHeight / 2 };
    });

    // start EXACTLY at the title's left node centre, so the path originates from
    // the real anchor (not offset beside the heading).
    const tl = document.querySelector<HTMLElement>('[data-node="products:l"]');
    const start: Pt = tl
      ? { x: docPos(tl).x + tl.offsetWidth / 2 - lp.x, y: docPos(tl).y + tl.offsetHeight / 2 - lp.y }
      : { x: nodes[0].x, y: -70 };

    const { d, nodeFracs } = buildDesktop(start, nodes, mockHalf, h, bridge);
    setGeo({ w, h, d, nodeFracs, nodes });
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

  // reduced motion: show everything statically (full path already drawn at 1).
  React.useEffect(() => {
    if (!reduce) return;
    const svg = svgRef.current;
    const list = svg?.parentElement;
    list?.querySelectorAll<HTMLElement>("[data-pj-row]").forEach((r) => r.setAttribute("data-revealed", ""));
    svg?.querySelectorAll<SVGGElement>("[data-pj-node]").forEach((n) => n.setAttribute("data-active", ""));
    document.querySelector('[data-node="products:l"]')?.setAttribute("data-active", "");
  }, [reduce, geo.nodeFracs]);

  // scroll-linked draw (linear in scroll → side-to-side is visible) + reveal gated
  // on the DRAWN fraction reaching each node's own fraction along the path.
  React.useEffect(() => {
    if (reduce) { draw.set(1); return; }
    const svg = svgRef.current;
    const list = svg?.parentElement as HTMLElement | null;
    if (!svg || !list || !geo.nodeFracs.length) return;
    const tlNode = document.querySelector<HTMLElement>('[data-node="products:l"]');
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-pj-row]"));
    const dots = Array.from(svg.querySelectorAll<SVGGElement>("[data-pj-node]"));
    let raf = 0;
    const REF = 0.58;                       // line begins drawing as the list top passes here
    const SPAN = Math.max(1, geo.h * 0.92); // scroll distance that draws the whole path
    const applyFraction = (frac: number) => {
      draw.set(frac);
      if (frac > 0.003 && tlNode && !tlNode.hasAttribute("data-active")) tlNode.setAttribute("data-active", "");
      for (let i = 0; i < geo.nodeFracs.length; i++) {
        if (frac >= geo.nodeFracs[i]) {
          if (dots[i] && !dots[i].hasAttribute("data-active")) dots[i].setAttribute("data-active", "");
          if (rows[i] && !rows[i].hasAttribute("data-revealed")) rows[i].setAttribute("data-revealed", "");
        }
      }
    };
    const update = () => {
      raf = 0;
      const r = svg.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (r.bottom < -vh * 0.2) {
        applyFraction(1);
        return;
      }
      if (r.top > vh * 1.2) {
        draw.set(0);
        return;
      }
      const frac = clamp01((vh * REF - r.top) / SPAN);
      applyFraction(frac);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduce, draw, geo.nodeFracs, geo.h]);

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
            {/* blue gradient matching the global journey connector so the Products
                wire and the next section's connector read as ONE continuous line */}
            <linearGradient id="pj-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#7cc3ee" />
              <stop offset="0.55" stopColor="#58abce" />
              <stop offset="1" stopColor="#5ab0d0" />
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
