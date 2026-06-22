import React from "react";
import s from "./ds.module.css";

export type TextareaProps = {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, hint, error, id, className = "", ...rest }: TextareaProps) {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const invalid = Boolean(error);
  const control = (
    <textarea
      id={fieldId}
      className={[s.textarea, className].filter(Boolean).join(" ")}
      data-invalid={invalid || undefined}
      aria-invalid={invalid || undefined}
      {...rest}
    />
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
