"use client";
import React from "react";
import m from "./meteors.module.css";

/* Subtle brand-colored meteors. Rendered after mount (random positions would
   otherwise mismatch SSR/client hydration). Behind content; brand colors only. */

const BLUE = ["#2A92CC", "#58ABCE"];
const GOLD = ["#F4C65F", "#E2AA3B"];

export function Meteors({ count = 16 }: { count?: number }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);
  const meteors = React.useMemo(() => {
    const rand = (a: number, b: number) => a + Math.random() * (b - a);
    return Array.from({ length: count }, (_, i) => {
      const palette = i % 2 === 0 ? BLUE : GOLD;
      return {
        left: `${rand(-6, 100)}%`,
        len: `${rand(58, 110)}px`,
        dur: `${rand(5, 9).toFixed(2)}s`,
        delay: `${(-rand(0, 9)).toFixed(2)}s`, // negative → staggered, already mid-flight at load
        op: rand(0.32, 0.68).toFixed(2),
        rot: `${rand(-24, -14).toFixed(0)}deg`,
        color: palette[(Math.random() < 0.5 ? 0 : 1)],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className={m.wrap} aria-hidden="true">
      {mounted &&
        meteors.map((d, i) => (
          <span
            key={i}
            className={m.meteor}
            style={{
              color: d.color,
              ["--left" as string]: d.left,
              ["--len" as string]: d.len,
              ["--dur" as string]: d.dur,
              ["--delay" as string]: d.delay,
              ["--op" as string]: d.op,
              ["--rot" as string]: d.rot,
            } as React.CSSProperties}
          />
        ))}
    </div>
  );
}
