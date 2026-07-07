"use client";
import React from "react";
import { Icon } from "@/shared/components";
import { siteStyles as s, go } from "@/shared/utils/helpers";
import site from "@/shared/data/site.json";

/* ---------------- footer ---------------- */
export function Footer() {
  const NAV = site.nav as [string, string][];
  return (
    <footer style={{ position: "relative", zIndex: 9, background: "transparent", padding: "2rem 0 2.5rem" }}>
      <div className={s.wrap} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/assets/logo-mark.png" alt="" style={{ height: 28, width: "auto" }} />
          <span style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.02em" }}>Gienah</span>
        </div>
        <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
          {NAV.map(([label, id]) =>
            id.startsWith("/") ? (
              <a key={id} className={s.navlink} href={id}>{label}</a>
            ) : (
              <span key={id} className={s.navlink} onClick={() => go(id)}>{label}</span>
            )
          )}
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {["instagram", "linkedin", "github"].map((n) => <a key={n} href="#" style={{ color: "var(--text-tertiary)" }}><Icon name={n} size={19} /></a>)}
        </div>
      </div>
      <div className={s.wrap} style={{ marginTop: 28, paddingTop: 22, borderTop: "1px solid var(--border-subtle)", fontSize: 13, color: "var(--text-tertiary)" }}>© 2026 Gienah. Creating digital experiences beyond your expectations.</div>
    </footer>
  );
}
