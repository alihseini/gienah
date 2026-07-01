import React from "react";
import s from "../ds.module.css";

const Chevron = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

type Option = string | { value: string; label: string };
type Size = "sm" | "md" | "lg";
const SIZE: Record<Size, string> = { sm: s.selectSm, md: "", lg: s.selectLg };

export type SelectProps = {
  label?: string;
  hint?: string;
  error?: string;
  options?: Option[];
  children?: React.ReactNode;
  size?: Size;
  className?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size">;

export function Select({ label, hint, error, options = [], children, size = "md", id, className = "", ...rest }: SelectProps) {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const invalid = Boolean(error);
  const control = (
    <div className={s.selectwrap}>
      <select id={fieldId} className={[s.select, SIZE[size], className].filter(Boolean).join(" ")} data-invalid={invalid || undefined} {...rest}>
        {children
          ? children
          : options.map((o) => {
              const opt = typeof o === "string" ? { value: o, label: o } : o;
              return (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              );
            })}
      </select>
      <span className={s.selectwrapChev}><Chevron /></span>
    </div>
  );
  if (!label && !hint && !error) return control;
  return (
    <div className={s.field}>
      {label ? <label className={s.fieldLabel} htmlFor={fieldId}>{label}</label> : null}
      {control}
      {error ? (
        <span className={[s.fieldHint, s.fieldHintError].join(" ")}>{error}</span>
      ) : hint ? (
        <span className={s.fieldHint}>{hint}</span>
      ) : null}
    </div>
  );
}
