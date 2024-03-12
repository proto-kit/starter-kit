/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  webpack(config) {
    config.experiments = { ...config.experiments, topLevelAwait: true };
    return {
      ...config,
      optimization: {
        // workaround client-side runtime bug
        minimize: false,
      },
    };
  },
  compress: false,
};

module.exports = nextConfig;
