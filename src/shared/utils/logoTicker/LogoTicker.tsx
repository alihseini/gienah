import React from "react";
import { ImageLazy } from "@/shared/components";
import partners from "@/shared/data/partners.json";
import t from "./logoTicker.module.css";
import { SectionConnector } from "../sectionConnector/SectionConnector";

type Partner = { id: string; name: string; logo: string | null; url: string | null };

const PARTNERS = partners as Partner[];

/* Data-driven, seamless logo marquee. The list is rendered twice so a -50%
   translate loops without a gap. Logos that have no asset fall back to a wordmark. */
export function LogoTicker() {
  const row = [...PARTNERS, ...PARTNERS];
  return (
    <div className={t.shell} data-anim-pause>
      {/* The journey passes through the transparent ticker, below the logos. */}
      <div className={t.connectorLayer} aria-hidden="true">
        <SectionConnector sectionKey="ticker" role="pass" enter="l" />
      </div>
      <div className={t.wrap} role="region" aria-label="Companies we've worked with">
      <div className={t.track}>
        {row.map((p, i) => {
          const dup = i >= PARTNERS.length;
          const inner = p.logo ? (
            <ImageLazy className={t.logo} src={p.logo} alt={p.name} />
          ) : (
            <span className={t.wordmark}>{p.name}</span>
          );
          if (p.url && !dup) {
            return (
              <a key={i} className={t.item} href={p.url} target="_blank" rel="noopener noreferrer">{inner}</a>
            );
          }
          return (
            <span key={i} className={t.item} aria-hidden={dup || undefined}>{inner}</span>
          );
        })}
      </div>
      </div>
    </div>
  );
}
