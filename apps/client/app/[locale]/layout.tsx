import type { ReactNode } from 'react';

import { clsx } from 'clsx';
import { hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import * as rootParams from 'next/root-params';

import { fontMono, fontSans } from '@/shared/config';
import { routing } from '@/shared/i18n';
import { defaultMetadata, defaultViewport, SiteJsonLd } from '@/shared/seo';

import { AppProviders } from '../providers/AppProviders';

import 'modern-normalize/modern-normalize.css';
import '../globals.scss';

export const metadata = defaultMetadata;

export const viewport = defaultViewport;

export const generateStaticParams = () => routing.locales.map((locale) => ({ locale }));

const LocaleLayout = async ({ children }: { children: ReactNode }) => {
  const locale = await rootParams.locale();

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html className={clsx('dark', fontSans.variable, fontMono.variable)} lang={locale}>
      <body>
        <SiteJsonLd />
        <AppProviders locale={locale}>{children}</AppProviders>
      </body>
    </html>
  );
};

export default LocaleLayout;
