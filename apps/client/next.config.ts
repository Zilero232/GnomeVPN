import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';

import rootPackage from '../../package.json' with { type: 'json' };
import { CLIENT_ROOT, IMAGES, loadRootEnv, OPTIMIZED_PACKAGES, REPO_ROOT, SECURITY_HEADERS } from './config';

loadRootEnv();

const withNextIntl = createNextIntlPlugin('./shared/i18n/request.ts');

const nextConfig: NextConfig = {
  env: { NEXT_PUBLIC_APP_VERSION: rootPackage.version },
  cacheComponents: true,
  output: 'standalone',
  outputFileTracingRoot: REPO_ROOT,
  reactCompiler: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: IMAGES,
  experimental: { optimizePackageImports: OPTIMIZED_PACKAGES },
  sassOptions: { implementation: 'sass-embedded', loadPaths: [CLIENT_ROOT] },
  turbopack: { resolveAlias: { '@': CLIENT_ROOT } },
  headers: () => Promise.resolve([{ source: '/:path*', headers: SECURITY_HEADERS }])
};

export default withNextIntl(nextConfig);
