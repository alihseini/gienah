"use client";
import * as React from "react";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
// programmatic positioning MUST be instant: the page sets html{scroll-behavior:smooth}
// globally, so a plain scrollTo(y) would animate and fight native momentum.
const jumpTo = (y: number) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

/* usePinnedSteps — captures the Services / Products "tall track + sticky stage" decks and
 * steps through them ONE complete gesture = ONE item, then releases at the ends.
 *
 * Two things this version fixes (real-device feedback):
 *
 * 1. ENTRY JITTER. The previous hold re-asserted the scroll position every frame, which
 *    fought the browser's kinetic momentum (compositor vs main thread) and shook the
 *    scroll-linked connector. Instead, on capture we FREEZE the page (html{overflow:hidden}
 *    — kills user/kinetic scroll outright, no fight, no shake) and only move the scroll
 *    position PROGRAMMATICALLY per step (scrollTo still works while frozen), so the
 *    sticky stage and the scroll-linked connector stay rock-stable, and stepping still
 *    advances the connector. The scrollbar gap is compensated so desktop doesn't shift.
 *
 * 2. AGGRESSIVE TRACKPAD. A big two-finger swipe is one gesture but emits a long stream of
 *    wheel events (swipe + a long momentum tail). We treat it as a transaction: accumulate
 *    the NET (dominant) direction, commit ONE step past a hysteresis threshold (a tiny
 *    opposite tick can't flip it), then CONSUME the rest. We re-arm either on input silence
 *    OR when a clear, strong RE-ACCELERATION appears after the momentum has decayed (a new
 *    push) — so repeated aggressive swipes each move exactly one item and momentum never
 *    skips. Touch commits one step on touchend from total finger travel.
 *
 * States (`phase`): idle → pinned → releasing. Hot state in refs; React state holds only
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
    const END_DELAY = 110;     // ms of SILENCE that re-arms a wheel transaction
    const SPIKE_AFTER = 180;   // ms after a commit before a re-acceleration can re-arm
    const SPIKE_RATIO = 2.6;   // a new push must exceed this × the decayed valley
    const SPIKE_FLOOR = 26;    // …and this absolute magnitude
    const DECAYED = 0.5;       // …and the valley must have fallen to ≤ this × the gesture peak
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
    let locked = false;
    // wheel transaction
    let wMode: "collect" | "consume" = "collect";
    let wNet = 0, wPeak = 0, wValley = 0, commitAt = 0, endTimer = 0;
    let releaseAt = -1e9, keyAt = -1e9;
    // touch
    let touchOn = false, tY = 0, tNet = 0, tReleased = false, tEntry = false;

    const vh = () => window.innerHeight || 1;
    const geom = () => {
      const r = track.getBoundingClientRect();
      return { top: window.scrollY + r.top, range: Math.max(1, track.offsetHeight - vh()) };
    };
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

    // FREEZE the page so kinetic momentum / overscroll cannot move it (no re-assert fight,
    // no shake). Programmatic scrollTo still works while frozen, so stepping can advance
    // the scroll position (and the scroll-linked connector). Compensate the scrollbar gap
    // so desktop layout doesn't shift; on mobile the scrollbar is overlay (gap 0).
    const lockScroll = () => {
      if (locked) return; locked = true;
      const sbw = window.innerWidth - document.documentElement.clientWidth;
      document.documentElement.style.overflow = "hidden";
      if (sbw > 0) document.documentElement.style.paddingRight = sbw + "px";
    };
    const unlockScroll = () => {
      if (!locked) return; locked = false;
      document.documentElement.style.overflow = "";
      document.documentElement.style.paddingRight = "";
    };

    const armCollect = (seedDelta: number) => {
      wMode = "collect"; wNet = seedDelta; wPeak = Math.abs(seedDelta); wValley = Math.abs(seedDelta);
    };
    const closeWheel = () => { wMode = "collect"; wNet = 0; wPeak = 0; wValley = 0; if (endTimer) { clearTimeout(endTimer); endTimer = 0; } };
    const keepWheelAlive = () => { if (endTimer) clearTimeout(endTimer); endTimer = window.setTimeout(closeWheel, END_DELAY); };

    // CAPTURE: pin on the entry card chosen by de-noised travel direction, freeze the page,
    // and put the wheel transaction in "consume" so the entry gesture's momentum can't also
    // step (it re-arms only on silence or a fresh re-acceleration).
    const capture = (down = dirDown) => {
      phase = "pinned";
      setIndex(down ? 0 : count - 1);
      pinY = anchorY(index);
      jumpTo(pinY);
      lockScroll();
      wMode = "consume"; wPeak = 1e7; wValley = 1e7; commitAt = now(); keepWheelAlive();
      if (touchOn) tEntry = true;
    };
    const stepTo = (i: number) => { setIndex(i); pinY = anchorY(i); jumpTo(pinY); }; // scrollTo works while frozen
    const release = () => { phase = "releasing"; releaseAt = now(); unlockScroll(); closeWheel(); };

    // ---------------- scroll: entry capture + safety hold ----------------
    // Always attached (cheap, passive) so the entry can never be MISSED (an async IO attach
    // used to let fast flicks slip through before any listener existed).
    const onScroll = () => {
      const y = window.scrollY;
      const dy = y - lastY; lastY = y;
      if (Math.abs(dy) > 2) dirDown = dy > 0;     // de-noise jitter
      if (phase === "pinned") {
        // frozen: scrollY shouldn't move on its own; if it leaks (older iOS), snap it back.
        if (Math.abs(y - pinY) > 0.5) jumpTo(pinY);
        return;
      }
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      if (interactive && isPinned() && now() - releaseAt >= RELEASE_CD) capture();
    };

    // ---------------- wheel / trackpad ----------------
    const onWheel = (e: WheelEvent) => {
      if (phase === "releasing") return;                    // leaving → native scroll out
      if (phase === "idle") {
        if (now() - releaseAt < RELEASE_CD) return;
        if (isPinned()) { e.preventDefault(); capture(); return; } // backup (onScroll usually got it)
        const r = track.getBoundingClientRect();
        const d = normalize(e);
        if (d > 0 && r.top > 0 && r.top <= d) { e.preventDefault(); capture(true); return; }       // huge delta from above
        if (d < 0 && r.bottom < vh() && r.bottom - d >= vh()) { e.preventDefault(); capture(false); return; } // from below
        return;
      }
      // phase === "pinned" (page is frozen; we just read the events)
      e.preventDefault();
      keepWheelAlive();
      const d = normalize(e);
      const a = Math.abs(d);
      if (wMode === "collect") {
        wNet += d; if (a > wPeak) wPeak = a;
        if (Math.abs(wNet) < COMMIT) return;              // gathering net (ignores tiny noise)
        const dir = wNet > 0 ? 1 : -1;
        const next = index + dir;
        if (next < 0 || next >= count) { release(); return; }
        stepTo(next);
        wMode = "consume"; wValley = a; commitAt = now();
        return;
      }
      // consume: ignore the rest of this gesture + its momentum tail, but re-arm on a clear
      // re-acceleration once the momentum has decayed (a genuinely new aggressive swipe).
      if (a > wPeak) wPeak = a;
      if (a < wValley) wValley = a;
      if (now() - commitAt > SPIKE_AFTER && a >= SPIKE_FLOOR && wValley <= wPeak * DECAYED && a >= wValley * SPIKE_RATIO) {
        armCollect(d);                                    // a new gesture started
      }
    };

    // ---------------- touch (one swipe = one step, committed on touchend) ----------------
    const onTouchStart = (e: TouchEvent) => { touchOn = true; tY = e.touches[0]?.clientY ?? 0; tNet = 0; tReleased = false; tEntry = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (phase === "releasing") return;
      if (phase === "idle") {
        if (isPinned() && now() - releaseAt >= RELEASE_CD) { e.preventDefault(); capture(); } // de-noised dir
        return;
      }
      if (tEntry) { e.preventDefault(); return; }          // entry drag only pins
      tNet = tY - (e.touches[0]?.clientY ?? tY);
      const dir = tNet > 0 ? 1 : tNet < 0 ? -1 : 0;
      const next = index + dir;
      if (dir !== 0 && (next < 0 || next >= count)) {       // toward a boundary
        if (Math.abs(tNet) >= TOUCH_REL) { tReleased = true; release(); return; } // native scroll out
        e.preventDefault(); return;
      }
      e.preventDefault();                                   // hold — never scrub; commit on touchend
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
        return;
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
      if (phase === "pinned") { unlockScroll(); phase = "releasing"; } // never leave a freeze active
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      closeWheel();
    };

    let io: IntersectionObserver | undefined;
    try {
      io = new IntersectionObserver(([e]) => { if (e.isIntersecting) bindStep(); else unbindStep(); }, { rootMargin: "120% 0px 120% 0px" });
      io.observe(track);
    } catch { bindStep(); }

    return () => {
      window.removeEventListener("scroll", onScroll);
      unbindStep();
      unlockScroll();
      if (io) io.disconnect();
      if (endTimer) clearTimeout(endTimer);
    };
  }, [trackRef, count, enabled, interactive]);
}
