"use client";
import React from "react";
import { StarField } from "../starfield/StarField";
import s from "../site.module.css";
import type { VisualBudget } from "../visualBudget";

export function HomeStarBackdrop({ visualBudget = "full" }: { visualBudget?: VisualBudget }) {
  return (
    <div className={s.homeStarBackdrop} aria-hidden="true">
      <StarField
        density={5400}
        maxCount={360}
        reducedMax={120}
        shadow={false}
        constellations={false}
        shooting={false}
        scrollParallax
        visualBudget={visualBudget}
      />
    </div>
  );
}
