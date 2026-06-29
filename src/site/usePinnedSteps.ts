"use client";
import * as React from "react";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
// programmatic positioning MUST be instant: the page sets html{scroll-behavior:smooth}
// globally, so a plain scrollTo(y) would animate and fight native momentum.
const jumpTo = (y: number) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

/* usePinnedSteps — captures the Services / Products "tall track + sticky stage" decks and
 * steps through them ONE item per gesture, then releases at the ends.
 *
 * Why this version exists — the ENTRY HANDOFF:
 *   Earlier versions only took control once the stage was already pinned and only on an
 *   actual wheel/touch event. But a fast trackpad/touch flick that STARTS above the section
 *   carries the page in with native momentum, and on touch that momentum (kinetic scroll
 *   AFTER touchend) produces NO events to intercept — so it scrolled straight through the
 *   whole track and out the far side, blowing past every card.
 *
 *   The fix is a real capture + hold:
 *   1. CAPTURE happens in the scroll listener (which fires even during event-less kinetic
 *      momentum): the moment the track fills the viewport we pin, set the entry card by
 *      scroll DIRECTION (down → first, up → last) and consume the in-flight gesture.
 *   2. HOLD: while pinned we re-assert the pinned scroll position every scroll frame
 *      (instant), which snaps the page back and KILLS the momentum the controller cannot
 *      preventDefault (touch kinetic, overscroll). Because the stage is position:sticky the
 *      held position is visually invisible.
 *
 * Stepping is gesture-level, not event-level: a whole wheel stream (swipe + momentum tail)
 * is one transaction; direction is the NET dominant direction (a tiny opposite tick can't
 * flip it); one step commits per transaction past a hysteresis threshold; the rest is
 * consumed; re-arm only after input silence. Touch commits one step on touchend from total
 * finger travel (touchmove is held, never scrubbing). At a boundary the next outward gesture
 * releases to the neighbouring section; a cooldown stops an instant re-pin.
 *
 * States (`phase`): idle → pinned → releasing. Hot state is in refs; React state holds only
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
    const COMMIT = 40;         // net px of wheel/trackpad travel before a step commits
    const REL_MIN = 28;        // net px toward a boundary before the section releases
    const END_DELAY = 130;     // ms of SILENCE that closes a wheel transaction (reset each event)
    const SWIPE = 28;          // net px of finger travel (at touchend) that commits a step
    const TOUCH_REL = 24;      // net px toward a boundary during a touch drag before release
    const KEY_CD = 250;        // ms minimum between keyboard steps (tames key auto-repeat)
    const RELEASE_CD = 240;    // ms after a release during which we won't re-pin (anti-flicker)
    const EPS = 1.5;

    // ----- machine state (refs only — input never triggers a React render) -----
    let phase: "idle" | "pinned" | "releasing" = "idle";
    let index = 0;
    let pinY = 0;              // scroll position held while pinned (anchor of the active item)
    let lastY = window.scrollY;
    let dirDown = true;        // de-noised travel direction (entry card: down → first, up → last)
    // wheel transaction
    let wOpen = false, wDone = false, wNet = 0, endTimer = 0;
    let releaseAt = -1e9, keyAt = -1e9;
    // touch
    let touchOn = false, tY = 0, tNet = 0, tReleased = false, tEntry = false;

    const vh = () => window.innerHeight || 1;
    const geom = () => {
      const r = track.getBoundingClientRect();
      return { top: window.scrollY + r.top, range: Math.max(1, track.offsetHeight - vh()) };
    };
    // item i maps evenly across the pinned range; item 0 at the very top, last at the very
    // bottom, so a boundary release exits into the neighbour immediately.
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
    const keepWheelAlive = () => {
      if (endTimer) clearTimeout(endTimer);
      endTimer = window.setTimeout(closeWheel, END_DELAY);
    };

    // CAPTURE: pin the deck on the entry card chosen by the de-noised travel DIRECTION
    // (down → first, up → last) and consume whatever gesture is in flight so it can't
    // also step. Direction comes from accumulated scroll travel, never a single noisy
    // event, so a tiny opposite tick at entry can't pin the wrong end.
    const capture = (down = dirDown) => {
      phase = "pinned";
      setIndex(down ? 0 : count - 1);
      pinY = anchorY(index);
      jumpTo(pinY);
      wOpen = true; wDone = true; wNet = 0; keepWheelAlive(); // consume the entry wheel stream
      if (touchOn) tEntry = true;                            // consume the entry touch drag
    };
    const stepTo = (i: number) => { setIndex(i); pinY = anchorY(i); jumpTo(pinY); };
    const release = () => { phase = "releasing"; releaseAt = now(); pinY = NaN; closeWheel(); };

    // ---------------- scroll: entry capture + hold (the momentum-proof part) ----------------
    // Always attached (cheap, passive) so it can never MISS the entry scroll — that async
    // miss is what let fast flicks slip through before any wheel/touch event arrived.
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      if (Math.abs(dy) > 2) dirDown = dy > 0;   // de-noise: ignore sub-pixel jitter
      if (phase === "pinned") {
        // hold the pinned position; snap back any native/kinetic drift (this is what kills
        // the momentum the controller cannot preventDefault — touch kinetic / overscroll).
        if (Math.abs(y - pinY) > 0.5) jumpTo(pinY);
        return;
      }
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      // idle: capture the instant the stage fills the viewport — works even during the
      // event-less kinetic momentum of a fast touch flick that started above the section.
      if (interactive && isPinned() && now() - releaseAt >= RELEASE_CD) capture();
    };

    // ---------------- wheel / trackpad ----------------
    const onWheel = (e: WheelEvent) => {
      if (phase === "releasing") return;                    // leaving → native scroll (onScroll re-idles)
      if (phase === "idle") {                               // approaching → let native scroll bring it in
        if (now() - releaseAt < RELEASE_CD) return;
        if (isPinned()) { e.preventDefault(); capture(); return; } // backup (onScroll usually got it)
        // clamp a single delta big enough to cross the whole section in one event
        const r = track.getBoundingClientRect();
        const d = normalize(e);
        if (d > 0 && r.top > 0 && r.top <= d) { e.preventDefault(); capture(true); return; }
        if (d < 0 && r.bottom < vh() && r.bottom - d >= vh()) { e.preventDefault(); capture(false); return; }
        return;
      }
      // phase === "pinned"
      if (!wOpen) { wOpen = true; wDone = false; wNet = 0; }
      keepWheelAlive();
      if (wDone) { e.preventDefault(); return; }            // already committed → consume the tail
      wNet += normalize(e);
      const dir = wNet > 0 ? 1 : wNet < 0 ? -1 : 0;
      const next = index + dir;
      if (dir !== 0 && (next < 0 || next >= count)) {        // toward a boundary
        if (Math.abs(wNet) >= REL_MIN) { wDone = true; release(); return; } // release (no preventDefault)
        e.preventDefault(); return;
      }
      if (Math.abs(wNet) >= COMMIT) { e.preventDefault(); wDone = true; stepTo(next); return; } // one step, net dir
      e.preventDefault();                                   // accumulating → hold
    };

    // ---------------- touch (one swipe = one step, committed on touchend) ----------------
    const onTouchStart = (e: TouchEvent) => { touchOn = true; tY = e.touches[0]?.clientY ?? 0; tNet = 0; tReleased = false; tEntry = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (phase === "releasing") return;
      if (phase === "idle") {
        if (isPinned() && now() - releaseAt >= RELEASE_CD) { e.preventDefault(); capture(); } // de-noised dir
        return;
      }
      if (tEntry) { e.preventDefault(); return; }            // entry drag only pins
      tNet = tY - (e.touches[0]?.clientY ?? tY);
      const dir = tNet > 0 ? 1 : tNet < 0 ? -1 : 0;
      const next = index + dir;
      if (dir !== 0 && (next < 0 || next >= count)) {        // toward a boundary
        if (Math.abs(tNet) >= TOUCH_REL) { tReleased = true; release(); return; } // native scroll out
        e.preventDefault(); return;
      }
      e.preventDefault();                                    // hold — never scrub; commit on touchend
    };
    const onTouchEnd = () => {
      touchOn = false;
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
      if (phase === "releasing") return;
      if (phase === "idle") {
        if (isPinned() && now() - releaseAt >= RELEASE_CD) { e.preventDefault(); capture(fwd); keyAt = now(); }
        return; // (keys are discrete/noiseless, so the key's own direction is safe here)
      }
      if (now() - keyAt < KEY_CD) { e.preventDefault(); return; }
      const dir = fwd ? 1 : -1;
      const next = index + dir;
      if (next < 0 || next >= count) { release(); return; }
      e.preventDefault();
      keyAt = now();
      stepTo(next);
    };

    // ---------------- listener lifecycle ----------------
    // The scroll listener is attached for the whole lifetime (passive + a cheap early
    // return when far) so the entry capture can NEVER be missed — an async IO attach was
    // letting fast flicks slip in before any listener existed. The interactive
    // (preventDefault) wheel/touch/key listeners are bound only while the section is near
    // the viewport, which is always well before it pins.
    lastY = window.scrollY;
    window.addEventListener("scroll", onScroll, { passive: true });

    let stepBound = false;
    const bindStep = () => {
      if (stepBound || !interactive) return;
      stepBound = true;
      window.addEventListener("wheel", onWheel, { passive: false });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: false });
      window.addEventListener("touchend", onTouchEnd, { passive: true });
      window.addEventListener("keydown", onKey);
    };
    const unbindStep = () => {
      if (!stepBound) return;
      stepBound = false;
      if (phase === "pinned") phase = "releasing"; // never leave a hold active when detaching
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      closeWheel();
    };

    let io: IntersectionObserver | undefined;
    try {
      io = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) bindStep(); else unbindStep(); },
        { rootMargin: "120% 0px 120% 0px" } // bind a bit more than a screen early
      );
      io.observe(track);
    } catch {
      bindStep();
    }

    return () => {
      window.removeEventListener("scroll", onScroll);
      unbindStep();
      if (io) io.disconnect();
      if (endTimer) clearTimeout(endTimer);
    };
  }, [trackRef, count, enabled, interactive]);
}
