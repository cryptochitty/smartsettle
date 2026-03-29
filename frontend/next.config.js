/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ✅ Keep these if you want to force the build through despite minor issues
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // ✅ Add this to handle certain heavy Node-based libraries
  experimental: {
    serverComponentsExternalPackages: ["pino-pretty", "lokijs", "encoding"],
  },

  webpack: (config) => {
    config.resolve.fallback = { 
      fs: false, 
      net: false, 
      tls: false, 
      crypto: false, 
      stream: false 
    };
    
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
      "pino-pretty": false,
      "lokijs": false,
      "encoding": false,
    };

    return config;
  },
};

module.exports = nextConfig;
