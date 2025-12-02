import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  compiler: {
    removeConsole: isProd
      ? {
          exclude: ["error", "warn"],
        }
      : false,
  },
};

export default nextConfig;
