import { ProjectDetail } from "./components/ProjectDetail";
import productsData from "@/shared/data/products.json";
import type { Product } from "@/shared/data/types";

const PRODUCTS = productsData as Product[];

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: String(p.id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = PRODUCTS.find((x) => x.id === Number(id));
  return { title: p ? `${p.title} — Gienah` : "Gienah — Project" };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProjectDetail id={Number(id)} />;
}
