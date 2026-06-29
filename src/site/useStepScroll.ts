"use client";
import * as React from "react";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/* useStepScroll
 *
 * Turns a "tall-track + sticky stage" scroll deck (the Services / Products sections)
 * into a STEP-PINNED one: while the sticky stage fills the viewport, each scroll
 * GESTURE — a wheel flick, trackpad swipe, touch swipe or arrow key — advances
 * EXACTLY ONE item. Large/fast deltas and wheel/touch momentum can never skip
 * multiple items. At the first / last item the gesture is let through so the page
 * scrolls on to the neighbouring section (never a scroll trap).
 *
 * It does NOT change how the item index is derived — the section's own scroll
 * handler still maps scroll position → active index (so all visuals/transitions are
 * untouched). This hook only discretises HOW the page scrolls: instead of the raw
 * gesture delta, it programmatically scrolls to the next/prev item's scroll anchor
 * and holds a lock (that the momentum tail keeps alive) until the gesture rests.
 *
 * `factor` matches the section's own raw-progress divisor (it maps an item index to
 * the same scroll position the section reads back). Disabled under reduced motion. */
export function useStepScroll(
  trackRef: React.RefObject<HTMLElement | null>,
  count: number,
  opts: { factor?: number; enabled?: boolean } = {}
) {
  const { factor = 0.9, enabled = true } = opts;

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track || !enabled || count < 2) return;

    const MIN_LOCK = 540; // a step needs ~this long to settle before the next one
    const IDLE = 280;     // input must rest this long for the gesture to count as over
                          // (longer than a momentum tail's gaps, so one flick = one step)
    const SWIPE = 26;     // px of touch travel that commits a step

    let locked = false;
    let stepAt = 0;
    let lastInput = 0;
    let targetY: number | null = null;
    let guardFrom = 0; // when the inertia-guard may re-assert the target
    let pollTimer = 0;
    let wasPinned = false;

    const vh = () => window.innerHeight || 1;
    const metrics = () => {
      const r = track.getBoundingClientRect();
      const top = window.scrollY + r.top; // track's document-space top
      const dist = Math.max(1, track.offsetHeight - vh());
      return { r, top, dist };
    };
    const indexAt = (scrolled: number, dist: number) =>
      clamp(Math.floor(clamp(scrolled / (dist * factor), 0, 1) * count), 0, count - 1);
    const anchorY = (top: number, dist: number, i: number) =>
      top + ((i + 0.5) / count) * dist * factor;
    const isPinned = () => {
      const r = track.getBoundingClientRect();
      return r.top <= 1 && r.bottom >= vh() - 1;
    };

    const scheduleUnlock = () => {
      window.clearTimeout(pollTimer);
      pollTimer = window.setTimeout(() => {
        const t = now();
        if (t - lastInput >= IDLE && t - stepAt >= MIN_LOCK) {
          locked = false;
          targetY = null;
        } else scheduleUnlock();
      }, 60);
    };
    // step toward item `i`; `instant` (touch) jumps + guards immediately, the wheel
    // path animates and lets its momentum tail be absorbed by the lock instead.
    const goTo = (i: number, instant: boolean) => {
      const { top, dist } = metrics();
      targetY = anchorY(top, dist, i);
      locked = true;
      stepAt = lastInput = now();
      guardFrom = stepAt + (instant ? 0 : 480);
      window.scrollTo({ top: targetY, behavior: instant ? "auto" : "smooth" });
      scheduleUnlock();
    };
    // try to step one item in `dir`; returns false at a boundary (→ let it release)
    const step = (dir: number, instant: boolean) => {
      const { top, dist } = metrics();
      const cur = indexAt(window.scrollY - top, dist);
      const next = cur + dir;
      if (next < 0 || next > count - 1) return false;
      goTo(next, instant);
      return true;
    };

    // re-assert the step target while locked — absorbs wheel momentum and (mainly)
    // touch inertia that escapes preventDefault, so neither can carry past the item.
    const onScroll = () => {
      if (!locked || targetY == null) return;
      if (now() < guardFrom) return;
      if (Math.abs(window.scrollY - targetY) > 6) window.scrollTo({ top: targetY, behavior: "auto" });
    };

    const onWheel = (e: WheelEvent) => {
      if (!isPinned()) { wasPinned = false; return; }
      // just entered the pinned zone → snap to the entry item (first coming down,
      // last coming up) so a fast arrival can't shoot past the first item.
      if (!wasPinned) {
        wasPinned = true;
        const { top, dist } = metrics();
        const entry = e.deltaY >= 0 ? 0 : count - 1;
        if (Math.abs(window.scrollY - anchorY(top, dist, entry)) > 4) {
          e.preventDefault();
          goTo(entry, false);
          return;
        }
      }
      if (locked) { e.preventDefault(); lastInput = now(); return; }
      if (Math.abs(e.deltaY) < 1) return;
      if (step(e.deltaY > 0 ? 1 : -1, false)) e.preventDefault();
      // else: at a boundary — don't preventDefault, let the page scroll on (release)
    };

    let tStartY = 0;
    let tConsumed = false;
    const onTouchStart = (e: TouchEvent) => {
      tStartY = e.touches[0]?.clientY ?? 0;
      tConsumed = false;
      if (isPinned() && !wasPinned) wasPinned = true;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isPinned()) { wasPinned = false; return; }
      const dy = tStartY - (e.touches[0]?.clientY ?? tStartY); // swipe up (content up) → +
      const dir = dy > 0 ? 1 : -1;
      const { top, dist } = metrics();
      const cur = indexAt(window.scrollY - top, dist);
      const next = cur + dir;
      if (next < 0 || next > count - 1) return; // boundary → allow native scroll (release)
      e.preventDefault(); // pin: stop native scroll; we step on commit
      if (locked) { lastInput = now(); return; }
      if (!tConsumed && Math.abs(dy) > SWIPE) { tConsumed = true; step(dir, true); }
    };

    const onKey = (e: KeyboardEvent) => {
      if (!isPinned()) return;
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const down = e.key === "ArrowDown" || e.key === "PageDown";
      const up = e.key === "ArrowUp" || e.key === "PageUp";
      if (!down && !up) return;
      if (locked) { e.preventDefault(); lastInput = now(); return; }
      if (step(down ? 1 : -1, false)) e.preventDefault();
    };

    wasPinned = isPinned();
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(pollTimer);
    };
  }, [trackRef, count, factor, enabled]);
}
