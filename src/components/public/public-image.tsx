"use client";

import Image from "next/image";
import type { ComponentProps } from "react";
import { sanityImageLoader } from "@/lib/public-content/cms/image-loader";

/** Keep Next/Image sizing and lazy loading; resize CMS photos once at Sanity's CDN. */
export function PublicImage(props: ComponentProps<typeof Image>) {
  const remote = typeof props.src === "string" && props.src.startsWith("https://cdn.sanity.io/images/");
  return <Image {...props} alt={props.alt} loader={remote && !props.unoptimized ? sanityImageLoader : undefined} />;
}
