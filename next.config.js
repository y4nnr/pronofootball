const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  images: {
    domains: [
      'i.pravatar.cc',
      'scontent.fpoz5-1.fna.fbcdn.net', // Facebook CDN
      'images2.minutemediacdn.com', // Minute Media CDN
    ],
  },
  experimental: {
    forceSwcTransforms: true,
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    // Add ARM64 support for lightningcss
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig; 