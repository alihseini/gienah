"use client";
import * as React from "react";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
// programmatic positioning MUST be instant: the page sets html{scroll-behavior:smooth}
// globally, so a plain scrollTo(y) would animate and fight native momentum.
const jumpTo = (y: number) => window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });

/* usePinnedSteps — a transaction-based controller for the "tall track + sticky stage"
 * decks (Services / Products). While the sticky stage fills the viewport the deck is
 * PINNED and ONE intentional input transaction advances EXACTLY ONE item. At the
 * first / last item the next transaction in that direction RELEASES the section so the
 * page scrolls on to the neighbour — the user is never trapped.
 *
 * The core idea — an INPUT TRANSACTION, not a per-event gap heuristic:
 *   A real trackpad emits a long, irregular stream of wheel events (the swipe plus its
 *   momentum tail). The previous "gap between two events" heuristic could not tell a
 *   new swipe from the momentum tail: one stretched gap re-armed mid-tail (skip), and
 *   a steady slow stream never produced a gap so it never re-armed (stuck after one).
 *
 *   Instead we treat a whole continuous stream as ONE transaction. A "wheel-end" timer
 *   is RESET on every wheel event and only fires after the input has been SILENT for
 *   END_DELAY ms. Because momentum keeps the events (and therefore the reset) coming,
 *   the timer cannot fire mid-tail, so a transaction never re-arms inside its own
 *   momentum → it can NEVER skip. The first event of a transaction commits exactly one
 *   step; every later event in that transaction (including the entire momentum tail) is
 *   consumed and ignored. Only once input has truly stopped does the transaction close,
 *   and the next event opens a fresh one → the deck keeps responding to every new
 *   gesture and is never stuck.
 *
 * States (`phase`): idle → pinned → releasing. All hot state is in refs; React state
 * is only the active index (for rendering), updated at most once per step.
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
    const STEP_DELTA = 16;     // px of travel within a transaction before a step commits
    const END_DELAY = 140;     // ms of SILENCE that closes a wheel transaction (reset each event)
    const RELEASE_CD = 180;    // ms after a release during which we won't re-pin (anti-flicker)
    const SWIPE = 34;          // px touch travel that commits a step
    const KEY_CD = 260;        // ms minimum between keyboard steps (tames key auto-repeat)
    const EPS = 1.5;

    // ----- machine state (refs only — input never triggers a React render) -----
    let phase: "idle" | "pinned" | "releasing" = "idle";
    let index = 0;
    // wheel transaction
    let txnOpen = false;       // is a wheel stream currently in progress?
    let txnStepped = false;    // has this transaction already produced its one step?
    let txnAcc = 0;            // accumulated delta until a direction is committed
    let endTimer = 0;          // wheel-end timer (reset on every event)
    let releaseAt = -1e9;      // ts of the last release (for the re-pin cooldown)
    let keyAt = -1e9;          // ts of the last keyboard step

    const vh = () => window.innerHeight || 1;
    const geom = () => {
      const r = track.getBoundingClientRect();
      return { top: window.scrollY + r.top, range: Math.max(1, track.offsetHeight - vh()) };
    };
    // item i maps evenly across the pinned range; item 0 at the very top, last item at
    // the very bottom, so a boundary release exits into the neighbour immediately.
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

    const closeTxn = () => {
      txnOpen = false; txnStepped = false; txnAcc = 0;
      if (endTimer) { clearTimeout(endTimer); endTimer = 0; }
    };
    const keepTxnAlive = () => {            // reset the wheel-end timer on every event
      if (endTimer) clearTimeout(endTimer);
      endTimer = window.setTimeout(closeTxn, END_DELAY);
    };

    // pin on the ENTRY card chosen by gesture direction (down → first, up → last) — not
    // by scroll position, so even a fast/huge entry can never scrub past the first card.
    const engageAt = (i: number) => {
      phase = "pinned";
      setIndex(i);
      jumpTo(anchorY(i));                   // instant snap (invisible — stage is sticky)
      // the entry gesture only pins; mark its transaction already-stepped so its own
      // momentum can't also advance an item.
      txnOpen = true; txnStepped = true; txnAcc = 0;
      keepTxnAlive();
    };
    const stepTo = (i: number) => { setIndex(i); jumpTo(anchorY(i)); };
    const release = () => { phase = "releasing"; releaseAt = now(); closeTxn(); };

    // ---------------- wheel / trackpad ----------------
    const onWheel = (e: WheelEvent) => {
      // leaving: never preventDefault — let native scroll carry the page out; only go
      // idle once the stage has actually left the viewport (no immediate re-pin trap).
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      if (phase === "idle") {
        if (now() - releaseAt < RELEASE_CD) return;                 // anti-flicker after a release
        if (isPinned()) { e.preventDefault(); engageAt(e.deltaY >= 0 ? 0 : count - 1); return; }
        // not pinned yet — but clamp a delta big enough to cross the whole section in
        // one event, so a huge wheel can't blow straight past without pinning.
        const r = track.getBoundingClientRect();
        const d = normalize(e);
        if (d > 0 && r.top > 0 && r.top <= d) { e.preventDefault(); engageAt(0); return; }            // from above
        if (d < 0 && r.bottom < vh() && r.bottom - d >= vh()) { e.preventDefault(); engageAt(count - 1); return; } // from below
        return;                                                     // section not reached → native scroll
      }
      // phase === "pinned"
      if (!txnOpen) { txnOpen = true; txnStepped = false; txnAcc = 0; }
      keepTxnAlive();                         // every event extends the live transaction
      if (txnStepped) { e.preventDefault(); return; }            // one step already → consume tail
      txnAcc += normalize(e);
      if (Math.abs(txnAcc) < STEP_DELTA) { e.preventDefault(); return; } // gathering direction
      const dir = txnAcc > 0 ? 1 : -1;
      const next = index + dir;
      if (next < 0 || next >= count) { txnStepped = true; release(); return; } // boundary → let it scroll out
      e.preventDefault();
      txnStepped = true;
      stepTo(next);
    };

    // ---------------- touch (a swipe is a natural transaction: start → move → end) ----------------
    let tY = 0;
    let tStepped = false;
    const onTouchStart = (e: TouchEvent) => { tY = e.touches[0]?.clientY ?? 0; tStepped = false; };
    const onTouchMove = (e: TouchEvent) => {
      if (phase === "releasing") { if (!isPinned()) phase = "idle"; return; }
      if (phase === "idle") {
        if (!isPinned() || now() - releaseAt < RELEASE_CD) return;
        e.preventDefault();
        const ddy = tY - (e.touches[0]?.clientY ?? tY);
        engageAt(ddy >= 0 ? 0 : count - 1);   // swipe up (content up) → first, down → last
        tStepped = true;                      // entry swipe only pins
        return;
      }
      const dy = tY - (e.touches[0]?.clientY ?? tY); // swipe up (content up) → +
      if (Math.abs(dy) < 3) { e.preventDefault(); return; }
      const dir = dy > 0 ? 1 : -1;
      const next = index + dir;
      if (next < 0 || next >= count) { tStepped = true; release(); return; } // boundary → native scroll
      e.preventDefault();
      if (!tStepped && Math.abs(dy) > SWIPE) { tStepped = true; stepTo(next); }
    };
    const onTouchEnd = () => { tStepped = false; };

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
      if (now() - keyAt < KEY_CD) { e.preventDefault(); return; } // tame auto-repeat
      const dir = fwd ? 1 : -1;
      const next = index + dir;
      if (next < 0 || next >= count) { release(); return; }       // boundary → default key scroll
      e.preventDefault();
      keyAt = now();
      stepTo(next);
    };

    // ---------------- passive scroll sync ----------------
    // scrollbar drag while idle scrubs the active item; and any time the stage leaves
    // the viewport we drop back to idle (so stale pinned/releasing state can't linger).
    const onScroll = () => {
      if (!isPinned()) { phase = "idle"; return; }
      if (phase === "idle") {
        const i = indexFromScroll();
        if (i !== index) setIndex(i);
      }
    };

    // ---------------- listener lifecycle ----------------
    // non-passive wheel/touch are bound only while the section is near the viewport
    let attached = false;
    const add = () => {
      if (attached) return;
      attached = true;
      window.addEventListener("scroll", onScroll, { passive: true });
      if (!interactive) return;               // reduced motion → scroll-sync only
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
      closeTxn();
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
      add();
    }

    return () => { remove(); if (io) io.disconnect(); if (endTimer) clearTimeout(endTimer); };
  }, [trackRef, count, enabled, interactive]);
}
