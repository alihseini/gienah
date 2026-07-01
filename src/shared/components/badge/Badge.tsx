import React from "react";
import s from "../ds.module.css";

type Variant = "neutral" | "accent" | "success" | "warning" | "danger" | "solid" | "outline";
const VARIANT: Record<Variant, string> = {
  neutral: s.badgeNeutral,
  accent: s.badgeAccent,
  success: s.badgeSuccess,
  warning: s.badgeWarning,
  danger: s.badgeDanger,
  solid: s.badgeSolid,
  outline: s.badgeOutline,
};

export type BadgeProps = {
  children?: React.ReactNode;
  variant?: Variant;
  dot?: boolean;
  leadingIcon?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export function Badge({ children, variant = "neutral", dot = false, leadingIcon, className = "", ...rest }: BadgeProps) {
  const cls = [s.badge, VARIANT[variant], dot ? s.badgeDot : "", className].filter(Boolean).join(" ");
  return (
    <span className={cls} {...rest}>
      {leadingIcon ? <span style={{ display: "inline-flex" }}>{leadingIcon}</span> : null}
      {children}
    </span>
  );
}
