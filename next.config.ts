import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // BOB-12: the class card's sign-in is POST /masuk/kartu (the proxy's public
  // path); its handler lives under src/app/api/ (src/app/api/masuk/kartu/route.ts).
  // BOB-26: Gate 3's three signed-out doors follow the same shape: public
  // paths, handlers under src/app/api/ for their service-role calls (F01-S03).
  async rewrites() {
    return [
      { source: "/masuk/kartu", destination: "/api/masuk/kartu" },
      { source: "/masuk/password", destination: "/api/masuk/password" },
      { source: "/aktifkan/kode", destination: "/api/aktifkan/kode" },
      { source: "/aktifkan/periksa", destination: "/api/aktifkan/periksa" },
      // BOB-27 (Gate 4): «Lupa password?»'s three signed-out doors
      { source: "/masuk/lupa/kode", destination: "/api/masuk/lupa/kode" },
      { source: "/masuk/lupa/periksa", destination: "/api/masuk/lupa/periksa" },
      { source: "/masuk/lupa/password", destination: "/api/masuk/lupa/password" },
      { source: "/masuk/lupa/pin", destination: "/api/masuk/lupa/pin" },
      // owner ruling 2 (9 Nov): «Minta akun dibuka kembali»
      { source: "/masuk/buka-kembali/kirim", destination: "/api/masuk/buka-kembali/kirim" },
    ];
  },
};

export default nextConfig;
