import { SITE } from '@/shared/config';

export const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: SITE.lang,
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE.url}/#app`,
      name: SITE.name,
      description: SITE.description,
      applicationCategory: 'SecurityApplication',
      operatingSystem: 'Windows, macOS, Linux',
      url: SITE.url,
      offers: {
        '@type': 'Offer',
        price: '100',
        priceCurrency: 'RUB',
        category: 'subscription',
      },
    },
  ],
} as const;
