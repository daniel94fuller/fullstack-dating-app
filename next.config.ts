import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "imljzgcuelzzzncfzlnc.supabase.co" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "xfdclkiezvhpqfjjdehz.supabase.co" },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  // ✅ ADD THIS
  allowedDevOrigins: ["kite-central-personally.ngrok-free.app"],
};

export default nextConfig;
