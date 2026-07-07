export type Tone = "gold" | "azure";

export type Product = {
  id: number;
  title: string;
  year: string;
  category: string;
  tech: string;
  tone: Tone;
  featured: boolean;
  featuredIcon?: string;
  website?: string;
  download?: string;
  banner: string | null;
  shots: string[];
  /** Image shown as the primary visual in the products section. */
  landingShot: string | null;
  blurb: string;
  desc: string[];
  /** Optional case-study extras. When absent, the detail page derives sensible
   *  fallbacks from category/tech/desc so every project renders fully. */
  highlights?: { icon: string; title: string; desc: string }[];
  delivered?: string[];
};

export type Service = {
  icon: string;
  no: string;
  title: string;
  tone: Tone;
  desc: string;
  caps: string[];
  tags: string[];
};

export type AgileStage = {
  icon: string;
  name: string;
  items: string[];
};
