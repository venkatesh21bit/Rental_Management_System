/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Remove swcMinify completely to use default minifier
  experimental: {
    // Force disable SWC transforms to use Babel
    forceSwcTransforms: false,
  },
  images: {
    domains: [
      'localhost', 
      'rentalmanagementsystem-production.up.railway.app',
      'images.unsplash.com',
      'via.placeholder.com'
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://rentalmanagementsystem-production.up.railway.app/api',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://rentalmanagementsystem-production.up.railway.app/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
