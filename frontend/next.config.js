/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  
  // 1. ADD THIS: This fixes the "e is not a function" for ESM libraries
  transpilePackages: [
    "axios", 
    "@rainbow-me/rainbowkit", 
    "wagmi", 
    "viem", 
    "@tanstack/react-query"
  ],

  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false, net: false, tls: false,
      crypto: false, stream: false,
      http: false, https: false, os: false,
    };
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
      "lokijs": false,
      "encoding": false,
      "bufferutil": false,
      "utf-8-validate": false,
    };
    return config;
  },
};

module.exports = nextConfig;
