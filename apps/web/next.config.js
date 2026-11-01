const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '../../'),
  transpilePackages: [
    '@praman-network/ui',
    '@praman-network/types',
    '@praman-network/crypto',
    '@praman-network/zk',
    '@praman-network/sdk',
    '@praman-network/react',
  ],
};

module.exports = nextConfig;
