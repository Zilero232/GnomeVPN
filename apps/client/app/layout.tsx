import 'modern-normalize/modern-normalize.css';

import { clsx } from 'clsx';

import { fontMono, fontSans, SITE } from '@/shared/config';
import { defaultMetadata, defaultViewport, SiteJsonLd } from '@/shared/seo';
import { AppProviders } from './providers/AppProviders';

import './globals.scss';

import type { ReactNode } from 'react';

export const metadata = defaultMetadata;

export const viewport = defaultViewport;

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html className={clsx('dark', fontSans.variable, fontMono.variable)} lang={SITE.lang}>
    <body>
      <SiteJsonLd />
      <AppProviders>{children}</AppProviders>
    </body>
  </html>
);

export default RootLayout;
