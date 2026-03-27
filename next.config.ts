import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  allowedDevOrigins: [
    'preview-chat-2882cb48-1a63-4d84-8c37-0b6081c359a1.space.z.ai',
    '.space.z.ai',
    '.z.ai',
  ],
};

export default nextConfig;
