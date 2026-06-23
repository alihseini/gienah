import React from "react";
import c from "./logoConstellation.module.css";

/* The Gienah brand mark (faceted isometric hexagon "G") recreated as a premium
   hero constellation: star points on the hexagon corners + center + a couple of
   inner facet accents, with the outline and the three isometric spokes drawn
   progressively after the star field settles. The top vertex is the guiding
   star — slightly brighter, with a soft pulsing halo. Brand colors only.

   Reveal sequence (timed against the load animation):
     points pop in one-by-one  →  outline draws  →  spokes draw  →  guiding pulse
   The whole mark then floats very slowly. Placed to the right of the headline. */

const GOLD = "#F4C65F";
const GOLD2 = "#E2AA3B";
const BLUE = "#58ABCE";

// regular hexagon, viewBox 240, center (120,120), R = 92, pointy-top
const V = [
  { x: 120, y: 28 },    // 0 top — guiding star
  { x: 199.7, y: 74 },  // 1 upper-right
  { x: 199.7, y: 166 }, // 2 lower-right
  { x: 120, y: 212 },   // 3 bottom
  { x: 40.3, y: 166 },  // 4 lower-left
  { x: 40.3, y: 74 },   // 5 upper-left
];
const CENTER = { x: 120, y: 120 };

const OUTLINE = `M ${V[0].x} ${V[0].y} L ${V[1].x} ${V[1].y} L ${V[2].x} ${V[2].y} L ${V[3].x} ${V[3].y} L ${V[4].x} ${V[4].y} L ${V[5].x} ${V[5].y} Z`;
// three isometric facet spokes (the 3D-hex look of the mark)
const SPOKES = `M ${CENTER.x} ${CENTER.y} L ${V[0].x} ${V[0].y} M ${CENTER.x} ${CENTER.y} L ${V[2].x} ${V[2].y} M ${CENTER.x} ${CENTER.y} L ${V[4].x} ${V[4].y}`;

// star points in reveal order — guiding star first, then around the ring, then
// the center and two faint inner facet accents.
const POINTS: { x: number; y: number; guide?: boolean; col: string; r: number }[] = [
  { ...V[0], guide: true, col: GOLD, r: 4 },
  { ...V[1], col: BLUE, r: 2.7 },
  { ...V[2], col: GOLD, r: 2.7 },
  { ...V[3], col: BLUE, r: 2.7 },
  { ...V[4], col: GOLD, r: 2.7 },
  { ...V[5], col: BLUE, r: 2.7 },
  { ...CENTER, col: BLUE, r: 2.5 },
  { x: 80, y: 120, col: GOLD2, r: 1.5 }, // faint inner facet accent
  { x: 160, y: 120, col: BLUE, r: 1.5 }, // faint inner facet accent
];

export const LogoConstellation = React.forwardRef<HTMLDivElement>(function LogoConstellation(_props, ref) {
  return (
    <div ref={ref} className={c.wrap} aria-hidden="true">
      <div className={c.float}>
        <svg className={c.svg} viewBox="0 0 240 240">
          <defs>
            <linearGradient id="gienahLine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={BLUE} />
              <stop offset="1" stopColor={GOLD} />
            </linearGradient>
          </defs>
          <path className={c.line} d={OUTLINE} pathLength={1} stroke="url(#gienahLine)" style={{ ["--ld" as string]: "1.6s" } as React.CSSProperties} />
          <path className={[c.line, c.spokes].join(" ")} d={SPOKES} pathLength={1} stroke={GOLD} style={{ ["--ld" as string]: "2.5s" } as React.CSSProperties} />
          <circle className={c.halo} cx={V[0].x} cy={V[0].y} r={17} />
          {POINTS.map((p, i) => (
            <circle
              key={i}
              className={[c.pt, p.guide ? c.guide : ""].filter(Boolean).join(" ")}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={p.guide ? "#fff" : p.col}
              style={{ ["--pd" as string]: `${0.9 + i * 0.14}s` } as React.CSSProperties}
            />
          ))}
        </svg>
      </div>
    </div>
  );
});
