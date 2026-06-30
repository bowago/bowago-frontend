import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack is used in dev (next dev --turbopack). Declaring it here
  // tells Next.js the webpack config absence is intentional, silencing
  // the "using Turbopack with a webpack config" build error on Vercel.
  turbopack: {},

  experimental: {
    // Tree-shake large packages to reduce bundle size
    optimizePackageImports: ["lucide-react", "recharts", "@reduxjs/toolkit"],
  },

  images: {
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
