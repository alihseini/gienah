import React from "react";
import c from "./logoConstellation.module.css";

/* The Gienah brand mark (faceted isometric hexagon) recreated as a constellation:
   star points on the hexagon's corners + center, with the outline and the three
   isometric facet spokes drawn progressively after load. Top vertex = guiding star. */

const GOLD = "#F4C65F";
const BLUE = "#58ABCE";

// regular hexagon, viewBox 240, center (120,120), R = 92, pointy-top
const V = [
  { x: 120, y: 28 },
  { x: 199.7, y: 74 },
  { x: 199.7, y: 166 },
  { x: 120, y: 212 },
  { x: 40.3, y: 166 },
  { x: 40.3, y: 74 },
];
const CENTER = { x: 120, y: 120 };

const OUTLINE = `M ${V[0].x} ${V[0].y} L ${V[1].x} ${V[1].y} L ${V[2].x} ${V[2].y} L ${V[3].x} ${V[3].y} L ${V[4].x} ${V[4].y} L ${V[5].x} ${V[5].y} Z`;
const SPOKES = `M ${CENTER.x} ${CENTER.y} L ${V[0].x} ${V[0].y} M ${CENTER.x} ${CENTER.y} L ${V[2].x} ${V[2].y} M ${CENTER.x} ${CENTER.y} L ${V[4].x} ${V[4].y}`;

const POINTS: { x: number; y: number; guide?: boolean; col: string; r: number }[] = [
  { ...V[0], guide: true, col: GOLD, r: 4 },
  { ...V[1], col: BLUE, r: 2.6 },
  { ...V[2], col: GOLD, r: 2.6 },
  { ...V[3], col: BLUE, r: 2.6 },
  { ...V[4], col: GOLD, r: 2.6 },
  { ...V[5], col: BLUE, r: 2.6 },
  { ...CENTER, col: BLUE, r: 2.4 },
];

export function LogoConstellation() {
  return (
    <div className={c.wrap} aria-hidden="true">
      <svg className={c.svg} viewBox="0 0 240 240">
        <defs>
          <linearGradient id="gienahLine" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={BLUE} />
            <stop offset="1" stopColor={GOLD} />
          </linearGradient>
        </defs>
        <path className={c.line} d={OUTLINE} pathLength={1} stroke="url(#gienahLine)" style={{ ["--ld" as string]: "0.7s" } as React.CSSProperties} />
        <path className={c.line} d={SPOKES} pathLength={1} stroke={GOLD} style={{ ["--ld" as string]: "1.1s", opacity: 0.7 } as React.CSSProperties} />
        <circle className={c.halo} cx={V[0].x} cy={V[0].y} r={16} />
        {POINTS.map((p, i) => (
          <circle
            key={i}
            className={[c.pt, p.guide ? c.guide : ""].filter(Boolean).join(" ")}
            cx={p.x}
            cy={p.y}
            r={p.r}
            fill={p.guide ? "#fff" : p.col}
            style={{ ["--pd" as string]: `${0.3 + i * 0.16}s` } as React.CSSProperties}
          />
        ))}
      </svg>
    </div>
  );
}
