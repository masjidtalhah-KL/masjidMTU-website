import type { NextConfig } from "next";
import { dataset, projectId } from "./src/sanity/env";

const nextConfig: NextConfig = {
  // The real public form can contain PII in any development session. Next 16.3's
  // React diagnostic channel writes IndexedDB, so disable it throughout development.
  // This is a diagnostic setting only; all public admission remains DB-authorized.
  ...(process.env.NODE_ENV === "development"
    ? { experimental: { reactDebugChannel: false }, devIndicators: false as const }
    : {}),
  async headers(){return ["/kempen/:slug/bayaran/:path*","/kempen/:slug/tajaan/bayaran/:path*"].map(source=>({source,headers:[{key:"Cache-Control",value:"private, no-store"},{key:"Referrer-Policy",value:"no-referrer"},{key:"X-Robots-Tag",value:"noindex, nofollow"},{key:"X-Content-Type-Options",value:"nosniff"},{key:"Content-Security-Policy",value:"default-src 'self'; script-src 'self' 'unsafe-inline'"+(process.env.NODE_ENV==="development"?" 'unsafe-eval'":"")+"; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.sanity.io; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'"}]}));},
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
