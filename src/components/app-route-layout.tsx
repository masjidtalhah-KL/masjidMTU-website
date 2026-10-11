"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PublicRouteTransition } from "./public/public-route-transition";
import { isIsolatedRoute } from "@/lib/admin/policy";
import { isPublicCampaignRoute } from "@/lib/campaigns/public-contract";

/** Isolated routes unmount the public transition and never retain authenticated content. */
export function AppRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (isIsolatedRoute(pathname) || isPublicCampaignRoute(pathname)) return children;
  return <PublicRouteTransition>{children}</PublicRouteTransition>;
}
