import React from "react";
import s from "./ds.module.css";

export type KbdProps = {
  children?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLElement>;

export function Kbd({ children, className = "", ...rest }: KbdProps) {
  return (
    <kbd className={[s.kbd, className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </kbd>
  );
}
