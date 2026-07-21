import { env, SITE } from '@/shared/config';

import type { Metadata, Viewport } from 'next';

export const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.title,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  referrer: 'origin-when-cross-origin',
  keywords: [...SITE.keywords],
  category: 'utilities',
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: [{ url: '/brand/favicon.svg', type: 'image/svg+xml' }],
    shortcut: '/brand/favicon.svg',
    apple: [{ url: '/brand/logo-mark.svg', type: 'image/svg+xml' }],
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.title,
    description: SITE.description,
    images: [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE.title,
    description: SITE.description,
    images: [SITE.ogImage],
  },
  verification: {
    ...(env.NEXT_PUBLIC_GOOGLE_VERIFICATION ? { google: env.NEXT_PUBLIC_GOOGLE_VERIFICATION } : {}),
    ...(env.NEXT_PUBLIC_YANDEX_VERIFICATION ? { yandex: env.NEXT_PUBLIC_YANDEX_VERIFICATION } : {}),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const defaultViewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: SITE.themeColor.light },
    { media: '(prefers-color-scheme: dark)', color: SITE.themeColor.dark },
  ],
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};
