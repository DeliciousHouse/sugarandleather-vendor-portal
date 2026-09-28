import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  env: { BUILD_REVISION: process.env.BUILD_REVISION ?? "" },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
