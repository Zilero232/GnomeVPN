import { SITE } from '@/shared/config';
import { localePath } from '@/shared/i18n';

import type { BreadcrumbJsonLdInput } from './breadcrumb-json-ld.types';

import { absoluteUrl } from '../../site-metadata';

export const breadcrumbJsonLd = ({ path, name, locale }: BreadcrumbJsonLdInput) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: SITE.name, item: absoluteUrl(localePath({ path: '/', locale })) },
    { '@type': 'ListItem', position: 2, name, item: absoluteUrl(localePath({ path, locale })) }
  ]
});
