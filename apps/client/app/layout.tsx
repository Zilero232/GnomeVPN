import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import { fontMono, fontSans, SITE } from '@/shared/config';
import { getTauriMobileHmrShim } from '@/shared/lib/tauri-mobile-hmr-shim';
import { defaultMetadata, defaultViewport, SiteJsonLd } from '@/shared/seo';

import { AppProviders } from './providers/AppProviders';

import 'modern-normalize/modern-normalize.css';
import './globals.scss';

export const metadata = defaultMetadata;

export const viewport = defaultViewport;

const tauriMobileHmrShim = getTauriMobileHmrShim();

const RootLayout = ({ children }: { children: ReactNode }) => (
  <html className={clsx('dark', fontSans.variable, fontMono.variable)} lang={SITE.lang}>
    <head>
      {tauriMobileHmrShim ? (
        <script
          suppressHydrationWarning
          // eslint-disable-next-line react/dom-no-dangerously-set-innerhtml -- dev-only inline HMR shim for the Tauri Android WebView
          dangerouslySetInnerHTML={{ __html: tauriMobileHmrShim }}
        />
      ) : null}
    </head>
    <body>
      <SiteJsonLd />
      <AppProviders>{children}</AppProviders>
    </body>
  </html>
);

export default RootLayout;
