import 'modern-normalize/modern-normalize.css';

import { SITE } from '@/shared/config';
import { defaultMetadata, defaultViewport, SiteJsonLd } from '@/shared/seo';
import { AppProviders } from './providers/AppProviders';

import './globals.scss';

import type { ReactNode } from 'react';

export const metadata = defaultMetadata;

export const viewport = defaultViewport;

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html className="dark" lang={SITE.lang}>
    <body>
      <SiteJsonLd />
      <AppProviders>{children}</AppProviders>
    </body>
  </html>
);

export default RootLayout;
