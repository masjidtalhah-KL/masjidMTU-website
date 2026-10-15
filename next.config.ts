import type { NextConfig } from "next";
import { dataset, projectId } from "./src/sanity/env";

const nextConfig: NextConfig = {
  // The real public form can contain PII in any development session. Next 16.3's
  // React diagnostic channel writes IndexedDB, so disable it throughout development.
  // This is a diagnostic setting only; all public admission remains DB-authorized.
  ...(process.env.NODE_ENV === "development"
    ? { experimental: { reactDebugChannel: false }, devIndicators: false as const }
    : {}),
  images: {
    remotePatterns: [{
      protocol: "https",
      hostname: "cdn.sanity.io",
      pathname: `/images/${projectId}/${dataset}/**`,
      search: "",
    }],
  },
};

export default nextConfig;
