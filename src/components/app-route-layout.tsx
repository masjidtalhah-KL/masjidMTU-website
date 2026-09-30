"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { PublicRouteTransition } from "./public/public-route-transition";

/** Studio has its own routing and must not animate or duplicate editor instances. */
export function AppRouteLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (pathname === "/studio" || pathname.startsWith("/studio/")) return children;
  return <PublicRouteTransition>{children}</PublicRouteTransition>;
}
