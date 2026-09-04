/** @type {import('next').NextConfig} */
import nextPWA from 'next-pwa';

const withPWA = nextPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.INTERNAL_BACKEND_URL || 'http://127.0.0.1:8000'}/api/:path*`,
      },
    ];
  },
};

export default withPWA(nextConfig);
