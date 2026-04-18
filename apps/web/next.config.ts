import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@takeaseat/ui"],
  typedRoutes: true,
};

export default config;
