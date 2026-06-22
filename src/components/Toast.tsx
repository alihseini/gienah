import React from "react";
import s from "./ds.module.css";

type Variant = "success" | "danger" | "accent";

const ICONS: Record<Variant, React.ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.12" /><path d="M6.5 10.2l2.3 2.3 4.7-4.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  danger: (
    <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.12" /><path d="M10 6v5M10 13.6v.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
  ),
  accent: (
    <svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="currentColor" opacity="0.12" /><path d="M10 9v5M10 6.4v.01" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>
  ),
};

const VARIANT: Record<Variant, string> = { success: s.toastSuccess, danger: s.toastDanger, accent: s.toastAccent };

export type ToastProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: Variant;
  action?: React.ReactNode;
  onClose?: () => void;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Toast({ title, description, variant = "accent", action, onClose, className = "", ...rest }: ToastProps) {
  return (
    <div className={[s.toast, VARIANT[variant], className].filter(Boolean).join(" ")} role="status" {...rest}>
      <span className={s.toastIcon}>{ICONS[variant]}</span>
      <div className={s.toastBody}>
        <div className={s.toastTitle}>{title}</div>
        {description ? <div className={s.toastDesc}>{description}</div> : null}
        {action ? <div style={{ marginTop: 10 }}>{action}</div> : null}
      </div>
      {onClose ? (
        <button
          aria-label="Dismiss"
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--gray-400)", padding: 2, display: "flex" }}
        >
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      ) : null}
    </div>
  );
}
