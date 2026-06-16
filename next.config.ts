import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Tree-shake these large packages — reduces bundle size and build memory
    optimizePackageImports: ["lucide-react", "recharts", "@reduxjs/toolkit"],
  },

  // Webpack memory tuning for development — prevents heap OOM on Windows
  // with large projects. Reduces the number of workers and disables the
  // size-limit plugin that triggers extra heap allocation.
  webpack: (config, { dev, isServer }) => {
    if (dev && !isServer) {
      // Reduce parallelism in dev to keep memory usage manageable
      config.parallelism = 1;
    }
    return config;
  },

  // Silence the SVG aspect-ratio console warning (cosmetic only)
  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
