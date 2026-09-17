import type { NextConfig } from 'next';

import createNextIntlPlugin from 'next-intl/plugin';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import rootPackage from '../../package.json' with { type: 'json' };

const clientRoot = path.resolve(import.meta.dirname);

const loadRootEnv = () => {
  const rootEnv = path.resolve(clientRoot, '..', '..', '.env');

  if (!existsSync(rootEnv)) {
    return;
  }

  for (const line of readFileSync(rootEnv, 'utf8').split('\n')) {
    const match = /^(NEXT_PUBLIC_[A-Z0-9_]*)=(.*)$/.exec(line.trim());

    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2];
    }
  }
};

loadRootEnv();

const withNextIntl = createNextIntlPlugin('./shared/i18n/request.ts');

const SECURITY_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' }
];

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_APP_VERSION: rootPackage.version
  },
  output: 'standalone',
  outputFileTracingRoot: path.resolve(clientRoot, '..', '..'),
  reactCompiler: true,
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 7
  },
  experimental: { optimizePackageImports: ['lucide-react', 'remeda', 'date-fns'] },
  sassOptions: { implementation: 'sass-embedded', loadPaths: [clientRoot] },
  turbopack: { resolveAlias: { '@': clientRoot } },
  headers: () => Promise.resolve([{ source: '/:path*', headers: SECURITY_HEADERS }])
};

export default withNextIntl(nextConfig);
