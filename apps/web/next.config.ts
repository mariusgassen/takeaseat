import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["@takeaseat/ui"],
  typedRoutes: true,
};

export default config;
