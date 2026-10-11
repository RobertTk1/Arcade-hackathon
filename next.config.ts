import type { NextConfig } from "next";

// The Lovable journal studio (journal-studio/, Vercel project "como-studio") is
// the site's front end. This app keeps /api and /order and proxies everything
// else to the studio, so both share one domain.
const STUDIO_URL = (
  process.env.STUDIO_URL ?? "https://como-studio.vercel.app"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return {
      // Studio pages win over this app's own pages at the same paths.
      beforeFiles: ["/", "/studio", "/inside", "/finished"].map((source) => ({
        source,
        destination: `${STUDIO_URL}${source}`,
      })),
      afterFiles: [],
      // Anything this app doesn't serve (studio assets, robots.txt, ...) goes to the studio.
      fallback: [{ source: "/:path*", destination: `${STUDIO_URL}/:path*` }],
    };
  },
};

export default nextConfig;
