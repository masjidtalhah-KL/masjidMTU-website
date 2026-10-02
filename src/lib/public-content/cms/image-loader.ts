import type { ImageLoaderProps } from "next/image";

/** Width only, fit=max: no crop, no upscale, and the source aspect ratio stays intact. */
export function sanityImageLoader({ src, width, quality }: ImageLoaderProps): string {
  const url = new URL(src);
  url.searchParams.set("w", String(width));
  url.searchParams.set("q", String(quality ?? 75));
  url.searchParams.set("fit", "max");
  url.searchParams.set("auto", "format");
  return url.toString();
}
