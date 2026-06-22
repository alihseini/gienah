import React from "react";
import s from "./ds.module.css";

export type RadioProps = {
  label?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Radio({ label, className = "", id, ...rest }: RadioProps) {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  return (
    <label className={[s.check, s.checkRadio, className].filter(Boolean).join(" ")} htmlFor={fieldId}>
      <input type="radio" id={fieldId} {...rest} />
      <span className={s.checkBox}><span className={s.checkDot} /></span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
