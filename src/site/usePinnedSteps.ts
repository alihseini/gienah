"use client";
import * as React from "react";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
// programmatic positioning MUST be instant: the page sets html{scroll-behavior:smooth}
// globally, so a plain scrollTo(y) would animate and fight native momentum.
const jumpTo = (y: number) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

/* usePinnedSteps — a GESTURE-transaction controller for the "tall track + sticky stage"
 * decks (Services / Products). While the sticky stage fills the viewport the deck is
 * PINNED and ONE complete physical gesture advances EXACTLY ONE item — regardless of how
 * far/fast the gesture is. At the first / last item the next gesture in that direction
 * RELEASES the section so the page scrolls on to the neighbour; the user is never trapped.
 *
 * The model is gesture-level, not event-level:
 *   - A continuous wheel/trackpad stream (the swipe + its whole momentum tail) is ONE
 *     transaction, closed only after the input has been SILENT for END_DELAY ms (a timer
 *     reset on every event, so momentum can never close it early and never re-arms inside
 *     itself → it can never skip).
 *   - The step DIRECTION is the NET (dominant) direction of the accumulated movement, not
 *     the first event — so a tiny accidental opposite tick at the start can't send the
 *     card the wrong way. Movement must pass a hysteresis threshold before a step commits,
 *     so tiny noise is ignored while any real swipe (small or large) commits exactly once.
 *   - After the one commit, the rest of the transaction (including the entire momentum
 *     tail) is consumed. A new gesture only after the input has fully stopped.
 *   - Touch is committed on touchend from the total finger travel; touchmove is held
 *     (preventDefault) so the deck can't scrub through several cards during a long drag.
 *
 * States (`phase`): idle → pinned → releasing. Hot state is in refs; React state is only
 * the active index (set at most once per committed step).
 */
export function usePinnedSteps(
  trackRef: React.RefObject<HTMLElement | null>,
  count: number,
  opts: { enabled?: boolean; interactive?: boolean; onIndex: (i: number) => void }
) {
  const { enabled = true, interactive = true, onIndex } = opts;
  const cb = React.useRef(onIndex);
  cb.current = onIndex;

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track || !enabled || count < 2) return;

    // ----- tuning -----
    const COMMIT = 48;         // net px of wheel/trackpad travel before a step commits
    const REL_MIN = 30;        // net px toward a boundary before the section releases
    const END_DELAY = 140;     // ms of SILENCE that closes a wheel transaction (reset each event)
    const SWIPE = 30;          // net px of finger travel (at touchend) that commits a step
    const TOUCH_REL = 24;      // net px toward a boundary during a touch drag before release
    const KEY_CD = 260;        // ms minimum between keyboard steps (tames key auto-repeat)
    const RELEASE_CD = 180;    // ms after a release during which we won't re-pin (anti-flicker)
    const EPS = 1.5;

    // ----- machine state (refs only — input never triggers a React render) -----
    let phase: "idle" | "pinned" | "releasing" = "idle";
    let index = 0;
    // wheel transaction
    let wOpen = false;         // is a wheel stream in progress?
    let wDone = false;         // has this transaction already committed (step or release)?
    let wNet = 0;              // net accumulated wheel delta (sign = dominant direction)
    let endTimer = 0;          // wheel-end timer (reset on every event)
    let releaseAt = -1e9;      // ts of the last release (re-pin cooldown)
    let keyAt = -1e9;          // ts of the last keyboard step

    const vh = () => window.innerHeight || 1;
    const geom = () => {
      const r = track.getBoundingClientRect();
      return { top: window.scrollY + r.top, range: Math.max(1, track.offsetHeight - vh()) };
    };
    // item i maps evenly across the pinned range; item 0 at the very top, last item at the
    // very bottom, so a boundary release exits into the neighbour immediately.
    const anchorY = (i: number) => {
      const { top, range } = geom();
      return top + (count <= 1 ? 0 : i / (count - 1)) * range;
    };
    const isPinned = () => {
      const r = track.getBoundingClientRect();
      return r.top <= EPS && r.bottom >= vh() - EPS;
    };
    const normalize = (e: WheelEvent) =>
      e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh() : 1);

    const setIndex = (i: number) => { index = i; cb.current(i); };

    const closeWheel = () => {
      wOpen = false; wDone = false; wNet = 0;
      if (endTimer) { clearTimeout(endTimer); endTimer = 0; }
    };
    const keepWheelAlive = () => {           // reset the wheel-end timer on every event
      if (endTimer) clearTimeout(endTimer);
      endTimer = window.setTimeout(closeWheel, END_DELAY);
    };

    // pin on the ENTRY card by gesture direction (down → first, up → last) — not by scroll
    // position, so even a fast/huge entry can never scrub past the first card.
    const engageAt = (i: number) => {
      phase = "pinned";
      setIndex(i);
      jumpTo(anchorY(i));                    // instant snap (invisible — stage is sticky)
      wOpen = true; wDone = true; wNet = 0;  // the entry gesture only pins; never also steps
      keepWheelAlive();
    };
    const stepTo = (i: number) => { setIndex(i); jumpTo(anchorY(i)); };
    const release = () => { phase = "releasing"; releaseAt = now(); closeWheel(); };

    // ---------------- wheel / trackpad ----------------
    const onWheel = (e: WheelEvent) => {
      // leaving: never preventDefault — let native scroll carry the page out; go idle once
      // the stage has actually left the viewport (no immediate re-pin trap).
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      if (phase === "idle") {
        if (now() - releaseAt < RELEASE_CD) return;                  // anti-flicker after a release
        if (isPinned()) { e.preventDefault(); engageAt(e.deltaY >= 0 ? 0 : count - 1); return; }
        // not pinned yet — clamp a delta big enough to cross the whole section in one event
        const r = track.getBoundingClientRect();
        const d = normalize(e);
        if (d > 0 && r.top > 0 && r.top <= d) { e.preventDefault(); engageAt(0); return; }
        if (d < 0 && r.bottom < vh() && r.bottom - d >= vh()) { e.preventDefault(); engageAt(count - 1); return; }
        return;                                                      // section not reached → native scroll
      }
      // phase === "pinned" — accumulate this gesture
      if (!wOpen) { wOpen = true; wDone = false; wNet = 0; }
      keepWheelAlive();                        // every event extends the live transaction
      if (wDone) { e.preventDefault(); return; }                     // already committed → consume tail
      wNet += normalize(e);
      const dir = wNet > 0 ? 1 : wNet < 0 ? -1 : 0;
      const next = index + dir;
      if (dir !== 0 && (next < 0 || next >= count)) {                // heading toward a boundary
        if (Math.abs(wNet) >= REL_MIN) { wDone = true; release(); return; } // release (no preventDefault)
        e.preventDefault(); return;                                  // small so far → hold, wait for intent
      }
      if (Math.abs(wNet) >= COMMIT) { e.preventDefault(); wDone = true; stepTo(next); return; } // one step, net dir
      e.preventDefault();                                            // accumulating → hold the page
    };

    // ---------------- touch (one swipe = one step, committed on touchend) ----------------
    let tY = 0;        // touchstart Y
    let tNet = 0;      // net finger travel (down-swipe / content-up = +)
    let tReleased = false;
    let tEntry = false;
    const onTouchStart = (e: TouchEvent) => { tY = e.touches[0]?.clientY ?? 0; tNet = 0; tReleased = false; tEntry = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      if (phase === "idle") {
        if (!isPinned() || now() - releaseAt < RELEASE_CD) return;
        const net = tY - (e.touches[0]?.clientY ?? tY);
        e.preventDefault();
        engageAt(net >= 0 ? 0 : count - 1);    // direction of the entry swipe
        tEntry = true;                          // entry swipe only pins
        return;
      }
      if (tEntry) { e.preventDefault(); return; }
      tNet = tY - (e.touches[0]?.clientY ?? tY);
      const dir = tNet > 0 ? 1 : tNet < 0 ? -1 : 0;
      const next = index + dir;
      if (dir !== 0 && (next < 0 || next >= count)) {                // toward a boundary
        if (Math.abs(tNet) >= TOUCH_REL) { tReleased = true; release(); return; } // native scroll out
        e.preventDefault(); return;
      }
      e.preventDefault();                       // hold — never scrub; commit on touchend
    };
    const onTouchEnd = () => {
      if (phase === "pinned" && !tReleased && !tEntry) {
        const dir = tNet > 0 ? 1 : tNet < 0 ? -1 : 0;
        const next = index + dir;
        if (dir !== 0 && Math.abs(tNet) >= SWIPE && next >= 0 && next < count) stepTo(next);
      }
      tNet = 0; tReleased = false; tEntry = false;
    };

    // ---------------- keyboard ----------------
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const fwd = e.key === "ArrowDown" || e.key === "PageDown" || e.key === " " || e.key === "Spacebar";
      const back = e.key === "ArrowUp" || e.key === "PageUp";
      if (!fwd && !back) return;
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      if (phase === "idle") {
        if (!isPinned() || now() - releaseAt < RELEASE_CD) return;
        e.preventDefault();
        engageAt(fwd ? 0 : count - 1);
        keyAt = now();
        return;
      }
      if (now() - keyAt < KEY_CD) { e.preventDefault(); return; }    // tame auto-repeat
      const dir = fwd ? 1 : -1;
      const next = index + dir;
      if (next < 0 || next >= count) { release(); return; }          // boundary → default key scroll
      e.preventDefault();
      keyAt = now();
      stepTo(next);
    };

    // ---------------- passive scroll sync ----------------
    const onScroll = () => {
      if (!isPinned()) { phase = "idle"; return; }
      if (phase === "idle") {
        const { top, range } = geom();
        const i = clamp(Math.round(((window.scrollY - top) / range) * (count - 1)), 0, count - 1);
        if (i !== index) setIndex(i);
      }
    };

    // ---------------- listener lifecycle ----------------
    let attached = false;
    const add = () => {
      if (attached) return;
      attached = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      if (!interactive) return;                // reduced motion → scroll-sync only
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
      closeWheel();
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
        { rootMargin: "100% 0px 100% 0px" }
      );
      io.observe(track);
    } catch {
      add();
    }

    return () => { remove(); if (io) io.disconnect(); if (endTimer) clearTimeout(endTimer); };
  }, [trackRef, count, enabled, interactive]);
}
