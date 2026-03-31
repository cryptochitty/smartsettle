/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  // Allow cross-origin for wallet assets
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.walletconnect.com" },
      { protocol: "https", hostname: "valoraapp.com" },
    ],
  },

  // ── Webpack Fix for Web3 Dependencies ──────────────────────────────────────
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fixes npm packages that depend on `fs` / `net` / `tls` etc.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: require.resolve("crypto-browserify"),
        stream: require.resolve("stream-browserify"),
        url: require.resolve("url"),
        zlib: require.resolve("browserify-zlib"),
        http: require.resolve("stream-http"),
        https: require.resolve("https-browserify"),
        assert: require.resolve("assert"),
        os: require.resolve("os-browserify"),
        path: require.resolve("path-browserify"),
      };
    }
    
    // Ignore optional dependencies that cause build errors in MetaMask SDK
    config.externals.push({
      "pino-pretty": "pino-pretty",
      "lokijs": "lokijs",
      "encoding": "encoding",
    });

    return config;
  },
};

module.exports = nextConfig;
