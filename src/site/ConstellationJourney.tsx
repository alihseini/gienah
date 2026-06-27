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
type Section = { key: string; enter: Side; exit: Side; exitNode?: string; gap?: boolean };

type Anchor = {
  x: number; y: number; key: string;
  kind: "hero" | "enter" | "exit";
  nodeSel?: string;
  gap?: boolean;        // the enter→this-exit leg is a hand-off gap (not drawn)
  yAnchored?: boolean;  // its scroll trigger comes from its own Y (not interpolated)
};
type Pt = { x: number; y: number };
type Seg = { p0: Pt; c1: Pt; c2: Pt; p3: Pt };

/* The horizontal extreme (apex) an inter-section leg bows toward, by viewport
 * width. Larger screens swing strongest; the apex is always clamped to stay a
 * comfortable margin INSIDE the viewport so no part of the leg is clipped and the
 * line never appears to vanish between sections. `navg` is the average x of the
 * leg's two endpoints; the bow reaches `reach·w` toward the nearer edge from it. */
function legApexX(navg: number, side: "left" | "right", w: number) {
  if (w < 768) {
    // mobile: let the line swing well past the edge so it exits one side and
    // re-enters lower — a path that feels bigger than the screen. The page's
    // overflow clips it, so it never adds a horizontal scrollbar.
    const reach = 0.55 * w;
    const off = 0.2 * w; // how far past the edge the apex may sit
    const raw = side === "left" ? navg - reach : navg + reach;
    return side === "left" ? Math.max(-off, raw) : Math.min(w + off, raw);
  }
  // tablet / desktop / large: broad, elegant, and always fully on-screen
  const reach = w >= 1440 ? 0.16 : w >= 1024 ? 0.12 : 0.09;
  const raw = side === "left" ? navg - reach * w : navg + reach * w;
  const margin = 26; // keep the whole curve on-screen
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
    // (the last section has no outgoing leg → no exit anchor). A section may name a
    // custom exit anchor (e.g. Agile's lower-left hand-off node) and flag the
    // enter→exit leg as a `gap` that the section fills with its own animation.
    const anchors: Anchor[] = [{ ...hero, key: "hero", kind: "hero" }];
    sections.forEach((sec, si) => {
      const enterPt = ptOf(`[data-node="${sec.key}:${sec.enter}"]`);
      if (!enterPt) return;
      anchors.push({ ...enterPt, key: sec.key, kind: "enter", nodeSel: `[data-node="${sec.key}:${sec.enter}"]` });
      if (si < sections.length - 1) {
        const exitSel = sec.exitNode ? `[data-node="${sec.exitNode}"]` : `[data-node="${sec.key}:${sec.exit}"]`;
        const exitPt = ptOf(exitSel);
        // a gap-exit sits at its own (lower) Y, so its scroll trigger must come
        // from that Y — the global line then pauses at the title while the section
        // plays its own line, and resumes once you scroll down to the gap-exit.
        if (exitPt) anchors.push({ ...exitPt, key: sec.key, kind: "exit", gap: !!sec.gap, yAnchored: !!sec.gap, nodeSel: sec.gap ? exitSel : undefined });
      }
    });
    if (anchors.length < 2) return;

    // build the path + keep each segment's real length so draw + arrivals align.
    // over-title legs (enter→exit, same key) bow up over the title; gap legs are a
    // moveto (no draw, zero length); every other leg hugs the nearer screen edge.
    const arcUp = w >= 768 ? 42 : 30;
    let d = `M ${anchors[0].x.toFixed(1)} ${anchors[0].y.toFixed(1)}`;
    const cum = [0];
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1], b = anchors[i];
      const sameTitle = a.kind === "enter" && b.kind === "exit" && a.key === b.key;
      if (sameTitle && b.gap) {
        // hand-off gap: lift the pen to the section's lower exit, draw nothing
        d += ` M ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
        cum.push(cum[i - 1] + 0.001);
        continue;
      }
      let c1: Pt, c2: Pt;
      if (sameTitle) {
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
      cum.push(cum[i - 1] + cubicLen({ p0: { x: a.x, y: a.y }, c1, c2, p3: { x: b.x, y: b.y } }) + 0.001);
      d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${b.x.toFixed(1)} ${b.y.toFixed(1)}`;
    }

    const total = cum[cum.length - 1] || 1;
    const fr = cum.map((v) => v / total);

    // scroll-progress trigger per anchor: a node is "reached" as its section nears
    // the upper-middle of the viewport. Y-anchored points (hero, each entry, and
    // any gap-exit) come from layout; ordinary beside-title exits are interpolated
    // in length-space between their neighbours so the over-title arc + outgoing leg
    // draw at a steady pace (no snapping). Forced strictly increasing.
    const vh = window.innerHeight || 1;
    const docScroll = Math.max(1, (document.documentElement.scrollHeight || h) - vh);
    const spBase: (number | null)[] = anchors.map((an) => {
      if (an.kind === "exit" && !an.yAnchored) return null;
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

  // arrivals: when the drawn head reaches an entry node, light it + its star and
  // fire onArrive (reveal) once; when it reaches a gap hand-off node (Agile's
  // lower-left), just light that node. Keyed by anchor index so the Agile title
  // and its gap node are tracked independently. data-active is toggled straight on
  // the DOM — no re-render.
  const firedRef = React.useRef<Set<string>>(new Set());
  const activatable = React.useMemo(
    () => geo.anchors.filter((a) => a.kind === "enter" || (a.kind === "exit" && a.gap && a.nodeSel)).length,
    [geo.anchors],
  );
  const checkArrivals = React.useCallback((v: number) => {
    if (firedRef.current.size >= activatable && activatable > 0) return; // all lit — idle
    geo.anchors.forEach((an, i) => {
      const isEnter = an.kind === "enter";
      const isGapExit = an.kind === "exit" && an.gap && !!an.nodeSel;
      if (!isEnter && !isGapExit) return;
      const key = String(i);
      if (firedRef.current.has(key)) return;
      if (v >= geo.fr[i] - 0.001) {
        firedRef.current.add(key);
        if (an.nodeSel) document.querySelector(an.nodeSel)?.setAttribute("data-active", "");
        if (isEnter) {
          document.querySelector(`[data-star="${an.key}"]`)?.setAttribute("data-active", "");
          onArrive(an.key);
        }
      }
    });
  }, [geo.anchors, geo.fr, activatable, onArrive]);
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
