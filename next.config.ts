import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverActions: {
    bodySizeLimit: '100mb', // Increase limit to 100 MB for large video uploads
  },
};

export default nextConfig;
