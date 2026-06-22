import React from "react";
import s from "./ds.module.css";

type Size = "sm" | "md" | "lg";
const SIZE: Record<Size, string> = { sm: s.inputSm, md: "", lg: s.inputLg };

export type InputProps = {
  label?: string;
  hint?: string;
  error?: string;
  leadingIcon?: React.ReactNode;
  size?: Size;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">;

export function Input({ label, hint, error, leadingIcon, size = "md", id, className = "", ...rest }: InputProps) {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const invalid = Boolean(error);
  const input = (
    <input
      id={fieldId}
      className={[s.input, SIZE[size], className].filter(Boolean).join(" ")}
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
      {...rest}
    />
  );
  const control = leadingIcon ? (
    <div className={s.inputwrap}>
      <span className={s.inputwrapIcon}>{leadingIcon}</span>
      {input}
    </div>
  ) : (
    input
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
