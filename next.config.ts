import type { NextConfig } from "next";
import { dataset, projectId } from "./src/sanity/env";

const nextConfig: NextConfig = {
  // Temporary 8.0 review: Next 16.3's dev debug channel otherwise writes IndexedDB.
  // Disable that framework persistence only for the explicitly enabled local demo.
  ...(process.env.NODE_ENV === "development" && process.env.QURBAN_PROTOTYPE === "1"
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
