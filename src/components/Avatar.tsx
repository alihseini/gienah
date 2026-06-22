import React from "react";
import s from "./ds.module.css";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
const SIZES: Record<Size, number> = { xs: 20, sm: 28, md: 36, lg: 44, xl: 56 };
const FONT: Record<Size, number> = { xs: 9, sm: 11, md: 13, lg: 16, xl: 20 };

function initials(name = "") {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return "";
  return ((parts[0][0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export type AvatarProps = {
  name?: string;
  src?: string;
  size?: Size | number;
  className?: string;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLSpanElement>;

export function Avatar({ name = "", src, size = "md", className = "", style, ...rest }: AvatarProps) {
  const px = typeof size === "number" ? size : SIZES[size];
  const fs = typeof size === "number" ? Math.round(px * 0.4) : FONT[size];
  return (
    <span
      className={[s.avatar, className].filter(Boolean).join(" ")}
      style={{ width: px, height: px, fontSize: fs, ...style }}
      title={name || undefined}
      {...rest}
    >
      {src ? <img src={src} alt={name} /> : initials(name)}
    </span>
  );
}
