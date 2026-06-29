"use client";
import * as React from "react";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());

/* usePinnedSteps — a small, explicit state machine for the "tall track + sticky
 * stage" decks (Services / Products). While the sticky stage fills the viewport the
 * deck is PINNED and each intentional gesture (wheel flick, trackpad swipe, touch
 * swipe, arrow key) advances EXACTLY ONE item. At the first / last item the next
 * gesture in that direction RELEASES the section so the page scrolls on to the
 * neighbour — the user is never trapped.
 *
 * States (`phase`):
 *   idle       — stage not filling the viewport; native scroll, input is a no-op.
 *   pinned     — stage fills the viewport; gestures step the active item.
 *   releasing  — a boundary gesture passed through; native scroll carries the page
 *                out and we wait (never re-pinning) until the stage has left.
 *
 * Why it is robust (vs. the old re-assert-on-scroll approach):
 *   - While pinned the page never moves on its own — every consumed wheel/touch is
 *     preventDefault()ed, so native momentum can't drift or fight us. The scroll
 *     position is only ever set programmatically, and because the stage is
 *     position:sticky that move is INVISIBLE — it only keeps the document position in
 *     sync with the active index so a boundary release lands on the right neighbour.
 *   - ONE step per gesture comes from a "fresh gesture" gate, not a timer: after a
 *     step the controller disarms, and only re-arms when input has paused (a gap
 *     larger than a momentum frame). Wheel/trackpad momentum keeps small gaps, so it
 *     can never re-arm → it can never skip. A genuine new flick comes after a pause →
 *     it arms and steps once. There is no input-fed lock that could get stuck.
 */
export function usePinnedSteps(
  trackRef: React.RefObject<HTMLElement | null>,
  count: number,
  opts: { enabled?: boolean; interactive?: boolean; onIndex: (i: number) => void }
) {
  const { enabled = true, interactive = true, onIndex } = opts;
  // keep the latest callback without re-binding listeners
  const cb = React.useRef(onIndex);
  cb.current = onIndex;

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track || !enabled || count < 2) return;

    // ----- tuning -----
    const STEP_DELTA = 26;     // accumulated wheel px that commits one step
    const GESTURE_GAP = 150;   // input quiet (ms) that starts a NEW gesture (re-arms)
    const ARM_NOISE = 2;       // min |delta| for a gap to count as a new gesture
    const SWIPE = 34;          // touch px that commits one step
    const EPS = 1.5;

    // ----- machine state (refs only — input never triggers a React render) -----
    let phase: "idle" | "pinned" | "releasing" = "idle";
    let index = 0;
    let acc = 0;               // accumulated wheel delta for the current gesture
    let armed = false;         // may the current gesture still commit a step?
    let lastTs = 0;            // ts of last wheel event (for gap detection)

    const vh = () => window.innerHeight || 1;
    const geom = () => {
      const r = track.getBoundingClientRect();
      const top = window.scrollY + r.top;                 // document-space track top
      const range = Math.max(1, track.offsetHeight - vh());
      return { top, range };
    };
    // item i maps evenly across the pinned range; item 0 sits at the very top and the
    // last item at the very bottom, so a boundary gesture releases into the neighbour
    // section immediately (no dead scroll distance left in the track).
    const anchorY = (i: number) => {
      const { top, range } = geom();
      return top + (count <= 1 ? 0 : i / (count - 1)) * range;
    };
    const indexFromScroll = () => {
      const { top, range } = geom();
      return clamp(Math.round(((window.scrollY - top) / range) * (count - 1)), 0, count - 1);
    };
    const isPinned = () => {
      const r = track.getBoundingClientRect();
      return r.top <= EPS && r.bottom >= vh() - EPS;
    };
    const normalize = (e: WheelEvent) =>
      e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh() : 1);

    const setIndex = (i: number) => { index = i; cb.current(i); };
    // pin the deck at its current scroll-derived item (entering from above → 0, from
    // below → last); snap the document position to that item's anchor (invisible — the
    // stage is sticky) so later steps + the release line up. lastTs is stamped so the
    // entry gesture's own momentum can't immediately step past the entry item.
    const engage = () => {
      phase = "pinned";
      setIndex(indexFromScroll());
      acc = 0; armed = false; lastTs = now();
      window.scrollTo(0, anchorY(index));
    };
    const stepTo = (i: number) => {
      setIndex(i);
      acc = 0; armed = false;
      window.scrollTo(0, anchorY(i)); // invisible; keeps document position in sync
    };
    const release = () => { phase = "releasing"; acc = 0; armed = false; };

    // ---------------- wheel / trackpad ----------------
    const onWheel = (e: WheelEvent) => {
      // mid-release: never preventDefault — let native scroll carry the page out, and
      // only return to idle once the stage has actually left the viewport (so a
      // boundary gesture can't immediately re-pin and trap the user).
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      // not pinned yet: let native scroll bring the stage in; engage the moment it fills
      if (phase === "idle") {
        if (!isPinned()) return;
        e.preventDefault();
        engage();
        return;
      }
      // pinned
      const ts = now();
      const gap = ts - lastTs;
      lastTs = ts;
      const d = normalize(e);
      if (gap > GESTURE_GAP && Math.abs(d) > ARM_NOISE) { armed = true; acc = 0; } // fresh gesture
      if (!armed) { e.preventDefault(); return; }                 // momentum tail → hold, ignore
      acc += d;
      if (Math.abs(acc) < STEP_DELTA) { e.preventDefault(); return; } // still accumulating
      const dir = acc > 0 ? 1 : -1;
      const next = index + dir;
      if (next < 0 || next >= count) { release(); return; }       // boundary → let it scroll out
      e.preventDefault();
      stepTo(next);
    };

    // ---------------- touch ----------------
    let tStartY = 0;
    let tConsumed = false;
    const onTouchStart = (e: TouchEvent) => {
      tStartY = e.touches[0]?.clientY ?? 0;
      tConsumed = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      if (phase === "idle") {
        if (!isPinned()) return;
        e.preventDefault();
        engage();
        tConsumed = true;            // entry swipe only pins; it doesn't also step
        return;
      }
      const dy = tStartY - (e.touches[0]?.clientY ?? tStartY); // swipe up (content up) → +
      if (Math.abs(dy) < 3) { e.preventDefault(); return; }
      const dir = dy > 0 ? 1 : -1;
      const next = index + dir;
      if (next < 0 || next >= count) { release(); return; }       // boundary → native scroll
      e.preventDefault();
      if (!tConsumed && Math.abs(dy) > SWIPE) { tConsumed = true; stepTo(next); }
    };
    const onTouchEnd = () => { tConsumed = false; };

    // ---------------- keyboard ----------------
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const fwd = e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "Spacebar";
      const back = e.key === "ArrowUp" || e.key === "PageUp";
      if (!fwd && !back) return;
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      if (phase === "idle") {
        if (!isPinned()) return;
        e.preventDefault();
        engage();
        return;
      }
      const dir = fwd ? 1 : -1;
      const next = index + dir;
      if (next < 0 || next >= count) { release(); return; }       // boundary → default key scroll
      e.preventDefault();
      stepTo(next);
    };

    // ---------------- passive scroll sync ----------------
    // when NOT actively pinning (the user drags the scrollbar, or the stage scrubs by
    // while idle), keep the active item in step with the scroll position, and drop any
    // stale pinned/releasing state once the stage leaves the viewport.
    const onScroll = () => {
      if (!isPinned()) { phase = "idle"; return; }
      if (phase === "idle") {
        const i = indexFromScroll();
        if (i !== index) setIndex(i);
      }
      // phase "pinned" / "releasing": we own the position; ignore our own scrolls
    };

    // ---------------- listener lifecycle ----------------
    // non-passive wheel/touch are bound only while the section is near the viewport
    let attached = false;
    const add = () => {
      if (attached) return;
      attached = true;
      // scroll-sync is always on; the interactive (step-hijacking) listeners are only
      // bound when motion is allowed. Under reduced motion the deck just scrubs.
      window.addEventListener("scroll", onScroll, { passive: true });
      if (!interactive) return;
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("keydown", onKey);
    };
    const remove = () => {
      if (!attached) return;
      attached = false;
      phase = "idle";
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
    };

    let io: IntersectionObserver | undefined;
    try {
      io = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) add(); else remove(); },
        { rootMargin: "100% 0px 100% 0px" } // attach a full screen early so engage is never missed
      );
      io.observe(track);
    } catch {
      add(); // no IO support → keep them on
    }

    return () => { remove(); if (io) io.disconnect(); };
  }, [trackRef, count, enabled, interactive]);
}
