import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // BOB-12: the class card's sign-in is POST /masuk/kartu (the proxy's public
  // path); its handler lives under src/app/api/ (src/app/api/masuk/kartu/route.ts).
  async rewrites() {
    return [{ source: "/masuk/kartu", destination: "/api/masuk/kartu" }];
  },
};

export default nextConfig;
