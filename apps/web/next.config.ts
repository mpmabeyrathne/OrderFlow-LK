import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  async rewrites() {
    return [{ source: "/backend/:path*", destination: (process.env.API_INTERNAL_URL ?? "http://localhost:3000") + "/:path*" }];
  },
};
export default nextConfig;
