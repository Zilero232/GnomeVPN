import path from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';

import type { NextConfig } from 'next';

const clientRoot = path.resolve(import.meta.dirname);

const withNextIntl = createNextIntlPlugin('./shared/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: false,
  images: { unoptimized: true },
  sassOptions: { loadPaths: [clientRoot] },
  turbopack: { resolveAlias: { '@': clientRoot } },
};

export default withNextIntl(nextConfig);
