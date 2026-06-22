"use client";
import React from "react";
import s from "./diaTextReveal.module.css";

/* Dia Text Reveal — text filled with a flowing multi-color gradient that shimmers
   through the palette (background-clip: text). Native CSS port, brand colors by default. */

const BRAND = ["#58ABCE", "#2A92CC", "#F4C65F", "#E2AA3B"];

export function DiaTextReveal({
  text,
  colors = BRAND,
  duration = 6,
  as: Tag = "span",
  className = "",
  style,
}: {
  text: string;
  colors?: string[];
  duration?: number;
  as?: React.ElementType;
  className?: string;
  style?: React.CSSProperties;
}) {
  const stops = [...colors, colors[0]]; // repeat first stop for a seamless loop
  const gradient = `linear-gradient(90deg, ${stops.join(", ")})`;
  return (
    <Tag
      className={[s.dia, className].filter(Boolean).join(" ")}
      style={{ backgroundImage: gradient, ["--dur" as string]: `${duration}s`, ...style } as React.CSSProperties}
    >
      {text}
    </Tag>
  );
}
