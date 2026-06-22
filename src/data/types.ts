export type Tone = "gold" | "azure";

export type Product = {
  id: number;
  title: string;
  year: string;
  category: string;
  tech: string;
  tone: Tone;
  featured: boolean;
  website?: string;
  download?: string;
  banner: string | null;
  shots: string[];
  blurb: string;
  desc: string[];
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
