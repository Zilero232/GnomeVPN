import { SITE } from '@/shared/config';
import { localePath } from '@/shared/i18n';

import type { ArticleJsonLdInput } from './article-json-ld.types';

import { absoluteUrl } from '../../site-metadata';

export const articleJsonLd = ({ headline, description, path, locale }: ArticleJsonLdInput) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline,
  description,
  inLanguage: locale,
  mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(localePath({ path, locale })) },
  author: { '@id': `${SITE.url}/#organization` },
  publisher: { '@id': `${SITE.url}/#organization` }
});
