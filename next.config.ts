import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "imljzgcuelzzzncfzlnc.supabase.co",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc", // ✅ ADD THIS
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

module.exports = {
  images: {
    domains: ["res.cloudinary.com", "xfdclkiezvhpqfjjdehz.supabase.co"],
  },
};

export default nextConfig;
