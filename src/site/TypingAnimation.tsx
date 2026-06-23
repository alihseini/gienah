"use client";
import React from "react";
import t from "./typing.module.css";

/* ---------------- Magic UI–style Typing Animation ----------------
 * Reveals `text` character by character when the element scrolls into view.
 *
 *  - Starts only once, and only when visible (not on page load).
 *  - No loop, no delete/retype — it types forward to completion and stops.
 *  - Reserves the full text space up front (an invisible placeholder holds the
 *    real, responsively-wrapped text) so there is zero layout shift and line
 *    breaks stay natural across desktop / tablet / mobile.
 *  - The blinking caret is unmounted once typing finishes.
 *  - prefers-reduced-motion: the full text is shown instantly, no caret.
 *
 * Adapted to this project's conventions (CSS modules + inline styles) — the
 * official Magic UI component depends on Tailwind + framer-motion + shadcn,
 * none of which this codebase uses.
 */

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function TypingAnimation({
  text,
  as: Tag = "p",
  speed = 28,
  startDelay = 0,
  className = "",
  style,
}: {
  text: string;
  /** Element to render (defaults to a paragraph). */
  as?: React.ElementType;
  /** Milliseconds per character. ~28ms reads calmly without dragging. */
  speed?: number;
  /** Delay after the element becomes visible before typing begins. */
  startDelay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = React.useRef<HTMLElement>(null);
  const [count, setCount] = React.useState(0);
  const [started, setStarted] = React.useState(false);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReduced()) {
      setCount(text.length);
      return;
    }

    let triggered = false;
    let raf = 0;
    let t0 = 0;
    let startTimer: ReturnType<typeof setTimeout>;

    const tick = (now: number) => {
      if (!t0) t0 = now;
      const n = Math.min(text.length, Math.floor((now - t0) / speed));
      setCount(n);
      if (n < text.length) raf = requestAnimationFrame(tick);
    };

    const begin = () => {
      if (triggered) return;
      triggered = true;
      // wait out the (cascade) delay, then start typing — only show the caret
      // once typing has actually begun, never while a paragraph waits its turn
      startTimer = setTimeout(() => { setStarted(true); raf = requestAnimationFrame(tick); }, startDelay);
    };

    const inView = () => {
      const r = el.getBoundingClientRect();
      return r.top < window.innerHeight && r.bottom > 0;
    };

    let io: IntersectionObserver | undefined;
    if (inView()) {
      begin();
    } else {
      try {
        io = new IntersectionObserver(
          ([e]) => { if (e.isIntersecting) { begin(); io && io.disconnect(); } },
          { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
        );
        io.observe(el);
      } catch { begin(); }
    }

    return () => {
      if (io) io.disconnect();
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(startTimer);
    };
  }, [text, speed, startDelay]);

  const typing = count < text.length;
  // hidden = space is reserved but text not yet shown (before typing starts, or mid-type)
  const hidden = !started || typing;

  return (
    <Tag ref={ref} className={className} style={{ position: "relative", ...style }}>
      {/* Full text reserves the space (and the real line-wrapping) up front.
          It is held transparent until typing completes, then revealed in place
          so the finished text sits exactly where the animation drew it. */}
      <span style={hidden ? { color: "transparent" } : undefined}>{text}</span>
      {started && typing && (
        <span aria-hidden="true" style={{ position: "absolute", inset: 0 }}>
          {text.slice(0, count)}
          <span className={t.cursor} />
        </span>
      )}
    </Tag>
  );
}
