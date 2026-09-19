import { CLIENT_REGISTRY, PLANS } from '@gnomevpn/schemas';

import { SITE } from '@/shared/config';
import { LOCALES } from '@/shared/i18n';

import { absoluteUrl } from '../../site-metadata';
import { PLATFORM_LABELS } from './site-json-ld.constants';

const priceRub = PLANS.map((plan) => plan.priceRub);

const OPERATING_SYSTEMS = [...new Set(CLIENT_REGISTRY.incy.platforms.map((platform) => PLATFORM_LABELS[platform]))];

const offers = PLANS.map((plan) => ({
  '@type': 'Offer',
  name: `${SITE.name} — ${plan.months} mo`,
  price: plan.priceRub,
  priceCurrency: 'RUB',
  category: 'subscription',
  availability: 'https://schema.org/InStock',
  url: absoluteUrl('/pricing')
}));

export const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: absoluteUrl('/brand/logo-mark.svg'),
      email: SITE.email,
      contactPoint: {
        '@type': 'ContactPoint',
        email: SITE.email,
        contactType: 'customer support',
        availableLanguage: ['Russian', 'English']
      }
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      publisher: { '@id': `${SITE.url}/#organization` },
      inLanguage: [...LOCALES]
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE.url}/#app`,
      name: SITE.name,
      description: SITE.description,
      applicationCategory: 'SecurityApplication',
      applicationSubCategory: 'VPN',
      operatingSystem: OPERATING_SYSTEMS.join(', '),
      publisher: { '@id': `${SITE.url}/#organization` },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'RUB',
        lowPrice: Math.min(...priceRub),
        highPrice: Math.max(...priceRub),
        offerCount: PLANS.length
      }
    }
  ]
};

export const productJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  '@id': `${SITE.url}/#product`,
  name: SITE.name,
  description: SITE.description,
  brand: { '@id': `${SITE.url}/#organization` },
  category: 'VPN service',
  offers: {
    '@type': 'AggregateOffer',
    priceCurrency: 'RUB',
    lowPrice: Math.min(...priceRub),
    highPrice: Math.max(...priceRub),
    offerCount: PLANS.length,
    offers
  }
};
