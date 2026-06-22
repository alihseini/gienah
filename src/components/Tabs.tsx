"use client";
import React from "react";
import s from "./ds.module.css";

export type TabItem = { value: string; label: React.ReactNode };

export type TabsProps = {
  tabs?: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
} & Omit<React.HTMLAttributes<HTMLDivElement>, "onChange">;

export function Tabs({ tabs = [], value, defaultValue, onChange, className = "", ...rest }: TabsProps) {
  const [internal, setInternal] = React.useState(defaultValue ?? (tabs[0] && tabs[0].value));
  const active = value !== undefined ? value : internal;
  const select = (v: string) => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  return (
    <div className={[s.tabs, className].filter(Boolean).join(" ")} role="tablist" {...rest}>
      {tabs.map((t) => (
        <button
          key={t.value}
          role="tab"
          className={s.tab}
          data-active={active === t.value}
          aria-selected={active === t.value}
          onClick={() => select(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
