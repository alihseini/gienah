import React from "react";

type FetchPriority = "high" | "low" | "auto";

export type ImageLazyProps = Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "loading" | "decoding" | "fetchPriority"
> & {
  src: string;
  alt: string;
  loading?: "eager" | "lazy";
  decoding?: "async" | "sync" | "auto";
  fetchPriority?: FetchPriority;
  priority?: boolean;
  eager?: boolean;
};

export function ImageLazy({
  priority = false,
  eager = false,
  loading,
  decoding,
  fetchPriority,
  ...props
}: ImageLazyProps) {
  const isPriority = priority || eager;

  return (
    <img
      {...props}
      loading={loading ?? (isPriority ? "eager" : "lazy")}
      decoding={decoding ?? (isPriority ? "sync" : "async")}
      fetchPriority={fetchPriority ?? (isPriority ? "high" : undefined)}
    />
  );
}
