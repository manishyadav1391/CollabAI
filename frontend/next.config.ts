import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack's dev filesystem cache (.next/dev/cache/turbopack) can go
  // stale across restarts on Windows and serve 404s for routes that exist
  // on disk. Disable it so `next dev` always recompiles the route tree
  // fresh instead of trusting a possibly-corrupt cache.
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
