"use client";
import React from "react";

/* Wrapper for the scroll-linked layered transition. The actual transforms are
   applied by useLayeredSections() (a single shared rAF loop) via [data-scroll-section]. */
export function ScrollSection({
  children,
  layer = 1,
  className = "",
  style,
}: {
  children: React.ReactNode;
  layer?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      data-scroll-section=""
      className={className}
      style={{ position: "relative", isolation: "isolate", zIndex: layer, willChange: "transform, opacity", transformOrigin: "center top", ...style }}
    >
      {children}
    </div>
  );
}
