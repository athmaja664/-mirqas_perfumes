import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sequelize", "mysql2"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  async redirects() {
    return [
      { source: "/shop", destination: "/shopallperfume", permanent: false },
      { source: "/collections", destination: "/shopallperfume", permanent: false },
      { source: "/collections/:path*", destination: "/shopallperfume", permanent: false },
      { source: "/search", destination: "/shopallperfume", permanent: false },
    ];
  },
};

export default nextConfig;
