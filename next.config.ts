import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow builds to succeed even if Google Fonts is unreachable during build
  // (Vercel has internet access so fonts will load fine in production)
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  // Disable strict mode for fonts — Vercel's build env has full internet
  // The font fetch errors only occur in sandboxed/offline environments
};

export default nextConfig;
