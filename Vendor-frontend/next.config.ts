import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  output: 'standalone',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/authentication',
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Handle client-side only libraries
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
};

export default nextConfig;
