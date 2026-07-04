"use client";
import React from "react";
import { StarField } from "../starfield/StarField";
import s from "../site.module.css";

export function HomeStarBackdrop() {
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
      />
    </div>
  );
}
