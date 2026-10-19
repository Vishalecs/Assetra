import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

/** @type {import('next').NextConfig} */
const nextConfig = (phase) => ({
  distDir: phase === PHASE_DEVELOPMENT_SERVER ? '.next-dev' : '.next',
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'https://assetra-ynox.onrender.com/api/v1/:path*',
      },
    ];
  },
});

export default nextConfig;
