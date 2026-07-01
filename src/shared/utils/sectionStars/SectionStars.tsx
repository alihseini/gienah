"use client";
import * as React from "react";
import { StarField } from "../starfield/StarField";
import s from "./sectionStars.module.css";

/* Shared, subtle star layer — the continuous cosmic "through-line".
 *
 * Rendered by the sections that don't already own a StarField (Hero / Products /
 * Agile do), so the star language never stops at a section boundary. It reuses the
 * existing <StarField> (no new background system) with the same restrained params
 * as the Products backdrop, and intentionally has NO top/bottom mask so stars run
 * edge-to-edge and meet the neighbouring section's stars — one continuous field.
 * Sits at z-index 0, behind each section's own animation + content. */
export function SectionStars() {
  return (
    <StarField
      className={s.stars}
      density={5600}
      maxCount={300}
      reducedMax={110}
      shadow={false}
      constellations={false}
      shooting={false}
    />
  );
}
