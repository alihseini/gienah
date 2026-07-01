import React from "react";
import s from "../ds.module.css";

type Variant = "default" | "flat" | "raised";
const VARIANT: Record<Variant, string> = { default: "", flat: s.cardFlat, raised: s.cardRaised };

export type CardProps = {
  children?: React.ReactNode;
  variant?: Variant;
  interactive?: boolean;
  padding?: number;
  className?: string;
  style?: React.CSSProperties;
} & React.HTMLAttributes<HTMLDivElement>;

export function Card({ children, variant = "default", interactive = false, padding = 20, className = "", style, ...rest }: CardProps) {
  const cls = [s.card, VARIANT[variant], interactive ? s.cardInteractive : "", className].filter(Boolean).join(" ");
  return (
    <div className={cls} style={{ padding, ...style }} {...rest}>
      {children}
    </div>
  );
}
