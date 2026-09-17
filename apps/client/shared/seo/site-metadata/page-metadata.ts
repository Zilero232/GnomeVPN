import type { Metadata } from 'next';

import { isNonNullish } from 'remeda';

import { SITE } from '@/shared/config';
import { DEFAULT_LOCALE, localePath, LOCALES } from '@/shared/i18n';

import type { PageMetadataInput } from './page-metadata.types';

const OG_LOCALES: Record<string, string> = {
  ru: SITE.locale,
  en: SITE.en.locale
};

const languageAlternates = (path: string) =>
  Object.fromEntries([
    ...LOCALES.map((locale) => [locale, localePath({ path, locale })]),
    ['x-default', localePath({ path, locale: DEFAULT_LOCALE })]
  ]);

export const createPageMetadata = ({ title, description, path, locale, index = false, follow = false }: PageMetadataInput): Metadata => {
  const ogTitle = title.includes(SITE.name) ? title : `${title} · ${SITE.name}`;
  const canonical = isNonNullish(path) ? localePath({ path, locale }) : undefined;
  const images = [{ url: SITE.ogImage, width: 1200, height: 630, alt: SITE.name }];

  return {
    title,
    description,
    ...(index && isNonNullish(path) ? { alternates: { canonical, languages: languageAlternates(path) } } : {}),
    robots: { index, follow },
    openGraph: {
      title: ogTitle,
      description,
      ...(isNonNullish(canonical) ? { url: canonical } : {}),
      type: 'website',
      locale: OG_LOCALES[locale],
      images
    },
    twitter: {
      title: ogTitle,
      description,
      images: [SITE.ogImage]
    }
  };
};
