import React from "react";
import s from "./ds.module.css";

const Check = () => (
  <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2.5 6.2l2.2 2.3L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export type CheckboxProps = {
  label?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({ label, className = "", id, ...rest }: CheckboxProps) {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  return (
    <label className={[s.check, className].filter(Boolean).join(" ")} htmlFor={fieldId}>
      <input type="checkbox" id={fieldId} {...rest} />
      <span className={s.checkBox}><Check /></span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
