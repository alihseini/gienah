"use client";
import React from "react";
import s from "./backgroundBeams.module.css";

/* Background Beams With Collision — native port of the Aceternity component,
   adapted to brand colors (azure + gold). Beams fall and "explode" on reaching
   the bottom. CSS drives the fall; the bottom-collision explosion is triggered
   by each beam's animation-iteration (so it pauses cleanly off-screen / reduced motion). */

const C = { blue1: "#58ABCE", blue2: "#2A92CC", gold1: "#F4C65F", gold2: "#E2AA3B" };

type Beam = { left: number; dur: number; delay: number; w: number; h: number; color: string };

const BEAMS: Beam[] = [
  { left: 6, dur: 7, delay: 0, w: 2, h: 14, color: C.blue1 },
  { left: 16, dur: 9, delay: 2, w: 3, h: 16, color: C.gold1 },
  { left: 28, dur: 6, delay: 1, w: 2, h: 12, color: C.blue2 },
  { left: 40, dur: 11, delay: 4, w: 2, h: 18, color: C.blue1 },
  { left: 52, dur: 8, delay: 0.5, w: 3, h: 14, color: C.gold2 },
  { left: 63, dur: 6.5, delay: 3, w: 2, h: 12, color: C.blue2 },
  { left: 74, dur: 10, delay: 1.5, w: 2, h: 16, color: C.blue1 },
  { left: 84, dur: 7.5, delay: 2.5, w: 3, h: 13, color: C.gold1 },
  { left: 93, dur: 9, delay: 0, w: 2, h: 15, color: C.blue2 },
];

let uid = 0;

function Explosion({ left, color }: { left: number; color: string }) {
  const sparks = React.useMemo(
    () =>
      Array.from({ length: 16 }, () => {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.95; // fan upward
        const dist = 28 + Math.random() * 72;
        const palette = [color, C.gold1, C.blue1, C.blue2];
        return {
          tx: Math.cos(ang) * dist,
          ty: Math.sin(ang) * dist,
          d: 0.7 + Math.random() * 0.5,
          c: palette[(Math.random() * palette.length) | 0],
        };
      }),
    [color]
  );
  return (
    <span className={s.explosion} style={{ left: `${left}%` }}>
      <span className={s.flash} style={{ background: `radial-gradient(circle, ${color}cc, transparent 70%)` }} />
      {sparks.map((sp, i) => (
        <span
          key={i}
          className={s.spark}
          style={{ background: sp.c, color: sp.c, ["--tx" as string]: `${sp.tx}px`, ["--ty" as string]: `${sp.ty}px`, ["--d" as string]: `${sp.d}s` } as React.CSSProperties}
        />
      ))}
    </span>
  );
}

export function BackgroundBeams() {
  const [explosions, setExplosions] = React.useState<{ id: number; left: number; color: string }[]>([]);
  const spawn = (b: Beam) => {
    const id = ++uid;
    setExplosions((e) => [...e, { id, left: b.left, color: b.color }]);
    setTimeout(() => setExplosions((e) => e.filter((x) => x.id !== id)), 1200);
  };
  return (
    <div className={s.root} data-abg="" aria-hidden="true">
      {BEAMS.map((b, i) => (
        <span
          key={i}
          className={s.beam}
          onAnimationIteration={() => spawn(b)}
          style={{
            left: `${b.left}%`,
            width: b.w,
            height: `${b.h}vh`,
            background: `linear-gradient(to top, ${b.color} 0%, ${b.color}00 100%)`,
            boxShadow: `0 0 12px ${b.color}80`,
            ["--dur" as string]: `${b.dur}s`,
            ["--delay" as string]: `${b.delay}s`,
          } as React.CSSProperties}
        />
      ))}
      {explosions.map((ex) => (
        <Explosion key={ex.id} left={ex.left} color={ex.color} />
      ))}
    </div>
  );
}
