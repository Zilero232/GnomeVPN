import { LOWEST_MONTHLY_RUB, PLANS } from '@gnomevpn/schemas';

import { SITE } from '@/shared/config';
import { LOCALES } from '@/shared/i18n';

import { absoluteUrl } from '../site-metadata';

const offers = PLANS.map((plan) => ({
  '@type': 'Offer',
  name: `${plan.months}`,
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
      inLanguage: LOCALES.map((locale) => locale)
    },
    {
      '@type': 'Product',
      '@id': `${SITE.url}/#product`,
      name: SITE.name,
      description: SITE.description,
      brand: { '@id': `${SITE.url}/#organization` },
      category: 'VPN service',
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'RUB',
        lowPrice: LOWEST_MONTHLY_RUB,
        highPrice: Math.max(...PLANS.map((plan) => plan.priceRub)),
        offerCount: PLANS.length,
        offers
      }
    }
  ]
};
