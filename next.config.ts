import type { NextConfig } from "next";
import { dataset, projectId } from "./src/sanity/env";

const nextConfig: NextConfig = {
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
