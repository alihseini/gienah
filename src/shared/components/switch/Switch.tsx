import React from "react";
import s from "../ds.module.css";

export type SwitchProps = {
  label?: string;
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Switch({ label, className = "", id, ...rest }: SwitchProps) {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  return (
    <label className={[s.switch, className].filter(Boolean).join(" ")} htmlFor={fieldId}>
      <input type="checkbox" role="switch" id={fieldId} {...rest} />
      <span className={s.switchTrack}><span className={s.switchThumb} /></span>
      {label ? <span>{label}</span> : null}
    </label>
  );
}
