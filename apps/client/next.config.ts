import path from 'node:path';

import type { NextConfig } from 'next';

const clientRoot = path.resolve(import.meta.dirname);

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: false,
  images: { unoptimized: true },
  sassOptions: { loadPaths: [clientRoot] },
  turbopack: { resolveAlias: { '@': clientRoot } },
};

export default nextConfig;
