import React from "react";
import s from "../ds.module.css";

export type DialogProps = {
  open: boolean;
  onClose?: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>;

export function Dialog({ open, onClose, title, description, children, footer, className = "", ...rest }: DialogProps) {
  if (!open) return null;
  return (
    <div className={s.dialogOverlay} onClick={onClose}>
      <div
        className={[s.dialog, className].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        {...rest}
      >
        {title || description ? (
          <div className={s.dialogHead}>
            {title ? <div className={s.dialogTitle}>{title}</div> : null}
            {description ? <div className={s.dialogDesc}>{description}</div> : null}
          </div>
        ) : null}
        {children ? <div className={s.dialogBody}>{children}</div> : null}
        {footer ? <div className={s.dialogFoot}>{footer}</div> : null}
      </div>
    </div>
  );
}
