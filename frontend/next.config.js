/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options",           value: "DENY" },
          { key: "X-Content-Type-Options",     value: "nosniff" },
          { key: "Referrer-Policy",            value: "origin-when-cross-origin" },
          { key: "Permissions-Policy",         value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Allow cross-origin for RainbowKit assets
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.walletconnect.com" },
      { protocol: "https", hostname: "valoraapp.com" },
    ],
  },
};

module.exports = nextConfig;
