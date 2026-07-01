import React from "react";
import { icons, type LucideProps } from "lucide-react";

/** Lucide icon, looked up by kebab-case name (e.g. "arrow-right"), matching the
 *  prototype's `<i data-lucide="...">` usage. Renders with a 1.75 stroke to match brand. */
function toPascal(name: string) {
  return name
    .split(/[-_]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

export type IconProps = {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
} & Omit<LucideProps, "ref">;

export function Icon({ name, size = 18, color, strokeWidth = 1.75, ...rest }: IconProps) {
  const Cmp = (icons as Record<string, React.ComponentType<LucideProps>>)[toPascal(name)];
  if (!Cmp) return null;
  return (
    <Cmp
      width={size}
      height={size}
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      style={{ display: "inline-flex", color }}
      {...rest}
    />
  );
}
