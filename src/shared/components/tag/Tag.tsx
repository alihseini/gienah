import React from "react";
import s from "../ds.module.css";

const X = () => (
  <svg viewBox="0 0 13 13" fill="none" aria-hidden="true">
    <path d="M3.5 3.5l6 6M9.5 3.5l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

export type TagProps = {
  children?: React.ReactNode;
  onRemove?: () => void;
  leadingIcon?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLSpanElement>;

export function Tag({ children, onRemove, leadingIcon, className = "", ...rest }: TagProps) {
  return (
    <span className={[s.tag, className].filter(Boolean).join(" ")} {...rest}>
      {leadingIcon ? <span style={{ display: "inline-flex" }}>{leadingIcon}</span> : null}
      {children}
      {onRemove ? (
        <span className={s.tagX} role="button" aria-label="Remove" onClick={onRemove}>
          <X />
        </span>
      ) : null}
    </span>
  );
}
