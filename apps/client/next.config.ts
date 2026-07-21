import path from 'node:path';
import createNextIntlPlugin from 'next-intl/plugin';

import rootPackage from '../../package.json' with { type: 'json' };

import type { NextConfig } from 'next';

const clientRoot = path.resolve(import.meta.dirname);

const withNextIntl = createNextIntlPlugin('./shared/i18n/request.ts');

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: rootPackage.version,
  },
  output: 'export',
  reactCompiler: true,
  reactStrictMode: false,
  images: { unoptimized: true },
  sassOptions: { implementation: 'sass-embedded', loadPaths: [clientRoot] },
  turbopack: { resolveAlias: { '@': clientRoot } },
};

export default withNextIntl(nextConfig);
