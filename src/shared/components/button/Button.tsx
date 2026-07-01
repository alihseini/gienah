import React from "react";
import s from "../ds.module.css";

type Variant = "primary" | "secondary" | "ghost" | "soft" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANT: Record<Variant, string> = {
  primary: s.btnPrimary,
  secondary: s.btnSecondary,
  ghost: s.btnGhost,
  soft: s.btnSoft,
  danger: s.btnDanger,
};
const SIZE: Record<Size, string> = { sm: s.btnSm, md: "", lg: s.btnLg };

export type ButtonProps = {
  children?: React.ReactNode;
  variant?: Variant;
  size?: Size;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  block?: boolean;
  as?: React.ElementType;
  className?: string;
} & Record<string, unknown>;

export function Button({
  children,
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  block = false,
  as: Tag = "button",
  className = "",
  ...rest
}: ButtonProps) {
  const cls = [s.btn, VARIANT[variant], SIZE[size], block ? s.btnBlock : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <Tag className={cls} {...rest}>
      {leadingIcon ? <span aria-hidden="true" style={{ display: "inline-flex" }}>{leadingIcon}</span> : null}
      {children ? <span>{children}</span> : null}
      {trailingIcon ? <span aria-hidden="true" style={{ display: "inline-flex" }}>{trailingIcon}</span> : null}
    </Tag>
  );
}
