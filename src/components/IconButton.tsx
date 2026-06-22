import React from "react";
import s from "./ds.module.css";

type Size = "sm" | "md" | "lg";
const SIZE: Record<Size, string> = { sm: s.iconbtnSm, md: "", lg: s.iconbtnLg };

export type IconButtonProps = {
  icon: React.ReactNode;
  label: string;
  size?: Size;
  bordered?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function IconButton({ icon, label, size = "md", bordered = false, className = "", ...rest }: IconButtonProps) {
  const cls = [s.iconbtn, SIZE[size], bordered ? s.iconbtnBordered : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} aria-label={label} title={label} {...rest}>
      {icon}
    </button>
  );
}
