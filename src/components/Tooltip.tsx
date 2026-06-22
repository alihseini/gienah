import React from "react";
import s from "./ds.module.css";

export type TooltipProps = {
  label: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export function Tooltip({ label, children, className = "", ...rest }: TooltipProps) {
  return (
    <span className={[s.tooltip, className].filter(Boolean).join(" ")} {...rest}>
      {children}
      <span className={s.tooltipPop} role="tooltip">{label}</span>
    </span>
  );
}
