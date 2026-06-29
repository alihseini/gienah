"use client";
import * as React from "react";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/* usePinnedSteps — Services / Products "tall track + sticky stage" decks.
 *
 * This does NOT hijack wheel/touch and never touches document overflow (an earlier
 * version did and broke the page). It does two safe, native things:
 *
 *  1. Maps the page scroll position within the track to the active card index (a cheap
 *     passive rAF-throttled scroll listener) — so the sticky deck shows the right card.
 *
 *  2. Lays one invisible CSS scroll-snap point per card across the track, each with
 *     `scroll-snap-stop: always`. Combined with `html { scroll-snap-type: y proximity }`
 *     the BROWSER snaps one card per scroll gesture and cannot fly past several cards in
 *     a single big flick — so "you can't scroll big through the section" is handled
 *     natively: the scrollbar still works, there's no momentum fight, no jitter, nothing
 *     to get stuck. Entering the section settles on the first card; leaving past the last
 *     card scrolls on to the next section normally.
 *
 * Disabled (no snapping, plain scroll-linked deck) under reduced motion.
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

    const vh = () => window.innerHeight || 1;
    const range = () => Math.max(1, track.offsetHeight - vh());

    // ----- scroll position → active index (passive, throttled) -----
    let raf = 0;
    let last = -1;
    const update = () => {
      raf = 0;
      const r = track.getBoundingClientRect();
      const scrolled = clamp(-r.top, 0, range());
      const i = clamp(Math.round((scrolled / range()) * (count - 1)), 0, count - 1);
      if (i !== last) { last = i; cb.current(i); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    // ----- one scroll-snap marker per card (native "one card per gesture") -----
    const markers: HTMLDivElement[] = [];
    const place = () => {
      const rng = range();
      for (let i = 0; i < count; i++) {
        markers[i].style.top = ((count <= 1 ? 0 : i / (count - 1)) * rng) + "px";
      }
    };
    if (interactive) {
      for (let i = 0; i < count; i++) {
        const m = document.createElement("div");
        m.setAttribute("aria-hidden", "true");
        m.style.cssText =
          "position:absolute;left:0;width:1px;height:1px;pointer-events:none;visibility:hidden;";
        m.style.scrollSnapAlign = "start";
        // each card is a mandatory stop so one gesture can't skip several cards
        (m.style as CSSStyleDeclaration & { scrollSnapStop: string }).scrollSnapStop = "always";
        track.appendChild(m);
        markers.push(m);
      }
      place();
    }

    // ----- safety cap: clamp an abnormally large SINGLE wheel delta to ~one card -----
    // Native scroll-snap-stop already stops momentum streams one card per gesture; this
    // only catches a single giant delta (which could otherwise jump several cards before
    // snapping). Normal wheel/trackpad deltas are far below the cap and pass straight
    // through to native scrolling + snapping, so this almost never fires.
    const pinnedZone = () => {
      const r = track.getBoundingClientRect();
      return r.top <= 1 && r.bottom >= vh() - 1;
    };
    const onWheelCap = (e: WheelEvent) => {
      if (!interactive || e.ctrlKey) return;             // (ctrl+wheel = zoom)
      const card = range() / (count - 1);
      const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? vh() : 1);
      if (Math.abs(d) <= card * 0.85) return;            // normal delta → native scroll + snap
      if (!pinnedZone()) return;                          // only inside the pinned section
      e.preventDefault();
      window.scrollBy({ top: Math.sign(d) * card, behavior: "smooth" }); // advance at most one card
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("resize", place);
    if (interactive) window.addEventListener("wheel", onWheelCap, { passive: false });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("resize", place);
      window.removeEventListener("wheel", onWheelCap);
      if (raf) cancelAnimationFrame(raf);
      for (const m of markers) m.remove();
    };
  }, [trackRef, count, enabled, interactive]);
}
