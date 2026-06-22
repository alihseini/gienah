import React from "react";
import a from "./aurora.module.css";

/* Aceternity-style aurora glow — drop behind a section's content (position it as
   a sibling before the content, with the content at a higher z-index). */
export function Aurora() {
  return (
    <div className={a.aurora} aria-hidden="true">
      <div className={[a.layer, a.l1].join(" ")} />
      <div className={[a.layer, a.l2].join(" ")} />
    </div>
  );
}
