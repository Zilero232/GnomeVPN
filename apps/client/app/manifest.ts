import type { MetadataRoute } from 'next';

import { SITE } from '@/shared/config';

const manifest = (): MetadataRoute.Manifest => ({
  name: SITE.name,
  short_name: SITE.name,
  description: SITE.description,
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: SITE.themeColor.dark,
  theme_color: SITE.themeColor.dark,
  lang: SITE.lang,
  icons: [
    { src: '/brand/favicon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
    { src: '/brand/logo-mark.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'maskable' }
  ]
});

export default manifest;
