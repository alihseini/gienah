import React from "react";
import a from "./aurora.module.css";

/* Atmospheric aurora layer — drop behind a section's content (position it as a
   sibling before the content, with the content at a higher z-index). */
export function Aurora() {
  return (
    <div className={a.aurora} aria-hidden="true">
      <span className={[a.band, a.b1].join(" ")} />
      <span className={[a.band, a.b2].join(" ")} />
      <span className={[a.band, a.b3].join(" ")} />
    </div>
  );
}
