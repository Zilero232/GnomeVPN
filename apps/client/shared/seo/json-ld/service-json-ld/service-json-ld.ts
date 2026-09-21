import { SITE } from '@/shared/config';

import type { ServiceJsonLdInput } from './service-json-ld.types';

import { SERVICE_TYPE } from './service-json-ld.constants';

export const serviceJsonLd = ({ name, description, countries }: ServiceJsonLdInput) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': `${SITE.url}/#service`,
  name,
  description,
  serviceType: SERVICE_TYPE,
  provider: { '@id': `${SITE.url}/#organization` },
  areaServed: countries.map((country) => ({ '@type': 'Country', name: country })),
  offers: { '@id': `${SITE.url}/#product` }
});
