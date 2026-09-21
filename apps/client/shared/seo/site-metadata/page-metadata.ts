import type { Metadata } from 'next';

import { isNonNullish } from 'remeda';

import { SITE } from '@/shared/config';
import { localePath } from '@/shared/i18n';

import type { PageMetadataInput } from './page-metadata.types';

import { languageAlternates } from './site-metadata.helpers';

const OG_LOCALES: Record<string, string> = {
  ru: SITE.locale,
  en: SITE.en.locale
};

export const createPageMetadata = ({ title, description, path, locale, index = false, follow = false }: PageMetadataInput): Metadata => {
  const ogTitle = title.includes(SITE.name) ? title : `${title} · ${SITE.name}`;
  const canonical = isNonNullish(path) ? localePath({ path, locale }) : undefined;

  return {
    title: { absolute: ogTitle },
    description,
    ...(index && isNonNullish(path) ? { alternates: { canonical, languages: languageAlternates(path) } } : {}),
    robots: { index, follow },
    openGraph: {
      title: ogTitle,
      description,
      ...(isNonNullish(canonical) ? { url: canonical } : {}),
      type: 'website',
      locale: OG_LOCALES[locale]
    },
    twitter: {
      title: ogTitle,
      description
    }
  };
};
