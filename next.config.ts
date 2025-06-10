import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  images: {
    domains: [
      "localhost",
      "lh3.googleusercontent.com",
      "https://app-bluerobins-nu.vercel.app",
      "zjcrwkaeulxkaprlmrbz.supabase.co",
    ],
  },
};

export default nextConfig;
