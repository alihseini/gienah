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
// (local y, drawn length-fraction) keypoints. The line is drawn up to the fraction
// whose path point sits at the scroll reference line, so the head's vertical
// position tracks the scroll exactly: it reaches each node as you scroll to it and
// PARKS across a gap (Agile's internal line) instead of jumping ahead.
type Key = { y: number; fr: number };

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

type Stroke = { d: string; keys: Key[] };
// turn a run of cubic segments into one continuous <path> + its Y→fraction draw
// keypoints. Each stroke is its OWN path element (no internal moveto): a moveto
// inside a single path makes SVG restart the stroke-dash pattern per subpath, so
// the two halves would fill simultaneously instead of in sequence — which is why
// Agile's outgoing leg looked "already drawn". Separate paths draw independently.
function buildStroke(segs: Seg[]): Stroke {
  const lens = segs.map(cubicLen);
  const total = lens.reduce((a, b) => a + b, 0) || 1;
  let d = `M ${segs[0].p0.x.toFixed(1)} ${segs[0].p0.y.toFixed(1)}`;
  const keys: Key[] = [{ y: segs[0].p0.y, fr: 0 }];
  let cum = 0, yprev = segs[0].p0.y;
  for (let i = 0; i < segs.length; i++) {
    const g = segs[i];
    d += ` C ${g.c1.x.toFixed(1)} ${g.c1.y.toFixed(1)}, ${g.c2.x.toFixed(1)} ${g.c2.y.toFixed(1)}, ${g.p3.x.toFixed(1)} ${g.p3.y.toFixed(1)}`;
    cum += lens[i];
    const y = Math.max(yprev + 1, g.p3.y); // force monotonic (over-title ends ≈ same y)
    keys.push({ y, fr: cum / total });
    yprev = y;
  }
  return { d, keys };
}

export function SectionConnector({ sectionKey, role = "mid", enter, exit, gap }: Props) {
  const svgRef = React.useRef<SVGSVGElement>(null);
  const reduce = useReducedMotion();
  const onArrive = useJourneyActivate();
  // up to two independently-drawn strokes: draw → stroke 0 (incoming, + over-title
  // exit for normal sections), draw2 → stroke 1 (Agile's outgoing leg, which must
  // wait and draw only once you reach the LAST card's node).
  const draw = useMotionValue(reduce ? 1 : 0);
  const draw2 = useMotionValue(reduce ? 1 : 0);

  // geometry, measured on mount/resize only (never per scroll frame).
  // nodeY = the entry node's local y (for arrival timing). The strokes carry their
  // own Y→fraction keypoints so each draws at its own scroll position.
  const [geo, setGeo] = React.useState<{ w: number; h: number; strokes: Stroke[]; nodeY: number | null }>({ w: 0, h: 0, strokes: [], nodeY: null });
  const firedRef = React.useRef(false);

  const measure = React.useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const box = svg.getBoundingClientRect();
    const w = box.width, h = box.height;
    if (!w || !h) return;
    // Measure node anchors in TRANSFORM-INDEPENDENT layout space (the offsetLeft/Top
    // chain) rather than getBoundingClientRect. A card/title entrance reveal animates
    // a transform that getBoundingClientRect folds in; because a transform doesn't
    // change layout size, the ResizeObserver never re-fires, so a getBoundingClientRect
    // measurement taken before the reveal settles would leave the line drawn at the
    // pre-reveal position (this is what put the Agile hand-off ~80px off its node).
    // The SVG fills its containing block via inset:0, so node-local = docPos(node) -
    // docPos(host), where host is the SVG's nearest positioned ancestor (the section
    // or sticky stage). Both are layout-space, so reveal/parallax/sticky transforms
    // never shift a node out from under the line.
    const docPos = (el: HTMLElement) => {
      let x = 0, y = 0, n: HTMLElement | null = el;
      while (n) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent as HTMLElement | null; }
      return { x, y };
    };
    let host: HTMLElement | null = svg.parentElement;
    while (host && getComputedStyle(host).position === "static") host = host.parentElement;
    const ho = docPos(host || document.body);
    const local = (sel: string): Pt | null => {
      const el = document.querySelector(sel) as HTMLElement | null;
      if (!el) return null;
      const d = docPos(el);
      return { x: d.x + el.offsetWidth / 2 - ho.x, y: d.y + el.offsetHeight / 2 - ho.y };
    };
    const node = (side: Side) => local(`[data-node="${sectionKey}:${side}"]`);

    // Each entry is one continuous run of segments → one independent <path>. The
    // Agile gap opens a SECOND stroke (the outgoing leg) so it can draw on its own
    // schedule instead of filling together with the incoming one.
    const strokeSegs: Seg[][] = [[]];
    const push = (a: Pt, c1: Pt, c2: Pt, b: Pt) => strokeSegs[strokeSegs.length - 1].push({ p0: a, c1, c2, p3: b });
    const newStroke = () => { strokeSegs.push([]); };
    // Below the desktop breakpoint (phones AND tablets, < 1024) a diagonal approach
    // to a node cuts across the title/cards, because the side lanes sit in (or past)
    // the narrow margin. Instead route an L: drop straight down the lane to the
    // node's level, then a short horizontal stub into the node (and the reverse on
    // exit) — the on-screen part is only the stub, in the empty margin beside the
    // title, never over the text. Desktop (>= 1024) keeps the original diagonal.
    const mob = w < 1024;
    const arc = mob ? 54 : 42; // over-title bow (taller below desktop to clear the title)
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
        // phones: enter from whichever edge the node actually sits nearest (on mobile
        // a card node can be on the opposite side from the desktop journey lane).
        const lx = mob ? laneX(en.x < w / 2 ? "l" : "r", w) : laneX(enter as Side, w);
        const top = { x: lx, y: 0 };
        if (mob) push(top, { x: lx, y: en.y * 0.55 }, { x: lx, y: en.y }, en); // down lane, then stub in
        else push(top, { x: lx, y: en.y * 0.45 }, { x: en.x, y: en.y * 0.7 }, en);
        nodeY = en.y;
      }
      if (role !== "end") {
        if (gap) {
          // Agile: the incoming leg ends at the first card; a SEPARATE stroke resumes
          // from the lower handoff node so it draws only when you reach the last card.
          const low = local(`[data-node="${sectionKey}:exitlow"]`);
          const ex = mob && low ? laneX(low.x < w / 2 ? "l" : "r", w) : laneX(exit ?? "l", w);
          if (low) {
            newStroke();
            const end = { x: ex, y: h };
            if (mob) push(low, { x: ex, y: low.y }, { x: ex, y: low.y + (end.y - low.y) * 0.5 }, end); // stub out, then down lane
            else push(low, { x: low.x, y: low.y + (end.y - low.y) * 0.4 }, { x: ex, y: end.y - (end.y - low.y) * 0.4 }, end);
          }
        } else if (exit && en) {
          const exNode = enter === exit ? en : node(exit);
          const exX = mob && exNode ? laneX(exNode.x < w / 2 ? "l" : "r", w) : laneX(exit, w);
          if (exNode) {
            // a different exit side bows over the title to the other node first; the
            // same side (About) just continues straight down from the same node.
            if (exNode !== en) push(en, { x: en.x, y: en.y - arc }, { x: exNode.x, y: exNode.y - arc }, exNode);
            const end = { x: exX, y: h };
            if (mob) push(exNode, { x: exX, y: exNode.y }, { x: exX, y: exNode.y + (end.y - exNode.y) * 0.5 }, end); // stub out, then down lane
            else push(exNode, { x: exNode.x, y: exNode.y + (end.y - exNode.y) * 0.4 }, { x: exX, y: end.y - (end.y - exNode.y) * 0.4 }, end);
          }
        }
      }
    }

    const strokes = strokeSegs.filter((s) => s.length).map(buildStroke);
    if (!strokes.length) return;
    setGeo({ w, h, strokes, nodeY });
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
    const REF = 0.62; // viewport reference line the line "draws to"
    const update = () => {
      raf = 0;
      const r = svg.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const q = vh * REF - r.top;
      // draw each stroke up to the path point sitting at the reference line — the
      // head's VERTICAL position tracks the scroll, so it lands on each node exactly
      // when you reach it and never overshoots/pre-draws. Stroke 1 (Agile's outgoing
      // leg) starts at the LAST node, so it only begins once you scroll to it.
      if (geo.strokes[0]) draw.set(interpKeys(geo.strokes[0].keys, q));
      if (geo.strokes[1]) draw2.set(interpKeys(geo.strokes[1].keys, q));
      // arrival fires on the ENTRY NODE's own screen position — robust for the tall
      // sticky decks where the title is pinned.
      if (geo.nodeY != null && r.top + geo.nodeY <= vh * REF) fire();
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduce, draw, draw2, geo.strokes, geo.nodeY, fire]);

  return (
    <svg
      ref={svgRef}
      className={c.sectionSvg}
      viewBox={geo.w ? `0 0 ${geo.w} ${geo.h}` : undefined}
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
    >
      {geo.strokes.length > 0 && (
        <>
          <defs>
            <linearGradient id={`cjg-${sectionKey}`} x1="0" y1="0" x2="0" y2="1">
              {role === "start" ? (
                <>
                  {/* originates from the bright hero star: subtle/faded at the star,
                      brightening as it moves away (matches the star's blue-white glow) */}
                  <stop offset="0" stopColor="#eaf6ff" stopOpacity="0" />
                  <stop offset="0.45" stopColor="#9ad2f0" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#5ab0d0" />
                </>
              ) : (
                <>
                  <stop offset="0" stopColor="#7cc3ee" />
                  <stop offset="0.5" stopColor="#3f9bdc" />
                  <stop offset="1" stopColor="#5ab0d0" />
                </>
              )}
            </linearGradient>
          </defs>
          {geo.strokes.map((st, i) =>
            reduce ? (
              <path key={i} className={c.draw} d={st.d} stroke={`url(#cjg-${sectionKey})`} pathLength={1} />
            ) : (
              <motion.path key={i} className={c.draw} d={st.d} stroke={`url(#cjg-${sectionKey})`} style={{ pathLength: i === 0 ? draw : draw2 }} />
            )
          )}
        </>
      )}
    </svg>
  );
}
