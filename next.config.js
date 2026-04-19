/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/rss',
        destination: '/api/rss',
      },
    ];
  },
};

module.exports = nextConfig;