import { SITE } from '@/shared/config';
import { localePath } from '@/shared/i18n';

import type { BreadcrumbJsonLdInput } from './breadcrumb-json-ld.types';

const absolute = (path: string) => new URL(path, SITE.url).toString();

export const breadcrumbJsonLd = ({ path, name, locale }: BreadcrumbJsonLdInput) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: SITE.name, item: absolute(localePath({ path: '/', locale })) },
    { '@type': 'ListItem', position: 2, name, item: absolute(localePath({ path, locale })) }
  ]
});
