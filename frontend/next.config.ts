import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["recharts"],
  experimental: {
    outputFileTracingExcludes: {
      "*": [
        "node_modules/@swc/**",
        "node_modules/webpack/**",
        "node_modules/terser/**",
      ],
    },
  },
  images: {
    domains: ["localhost"],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
