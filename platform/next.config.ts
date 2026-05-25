import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://dlvzrjnosgqcrulstwun.supabase.co/storage/**"),
    ],
  },
};

export default nextConfig;
