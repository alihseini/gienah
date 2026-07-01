"use client";
import * as React from "react";
import c from "../../components/sections/heroSection/constellationJourney.module.css";

/* Wraps a section title with its two constellation anchor nodes (left + right of
   the title) and the activation star above it. The ConstellationJourney overlay
   finds these by data-attribute, measures them, routes the line through them, and
   toggles data-active on the entry node + star when the line arrives. Purely
   decorative — pointer-events are off and it never changes the title's own layout
   (inline-block wrapper around the existing heading). */
export function TitleNodes({ id, children, sideNodes = true }: { id: string; children: React.ReactNode; sideNodes?: boolean }) {
  return (
    <div className={c.titleWrap} data-title={id}>
      <span className={c.star} data-star={id} aria-hidden="true" />
      {sideNodes && (
        <>
          <span className={[c.dash, c.dashL].join(" ")} aria-hidden="true" />
          <span className={[c.dash, c.dashR].join(" ")} aria-hidden="true" />
          <span className={[c.node, c.nodeL].join(" ")} data-node={`${id}:l`} aria-hidden="true" />
          <span className={[c.node, c.nodeR].join(" ")} data-node={`${id}:r`} aria-hidden="true" />
        </>
      )}
      {children}
    </div>
  );
}
