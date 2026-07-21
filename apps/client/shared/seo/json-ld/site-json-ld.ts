import { PLANS } from '@gnomevpn/schemas';

import { SITE } from '@/shared/config';
import ru from '@/shared/i18n/locales/ru.json';

const prices = PLANS.map((plan) => plan.priceRub);

const faqEntries = [
  { question: ru.landing.faq.q1, answer: ru.landing.faq.a1 },
  { question: ru.landing.faq.q2, answer: ru.landing.faq.a2 },
  { question: ru.landing.faq.q3, answer: ru.landing.faq.a3 },
  { question: ru.landing.faq.q4, answer: ru.landing.faq.a4 },
];

export const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE.url}/brand/logo-mark.svg`,
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      inLanguage: SITE.lang,
      publisher: { '@id': `${SITE.url}/#organization` },
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${SITE.url}/#app`,
      name: SITE.name,
      description: SITE.description,
      applicationCategory: 'SecurityApplication',
      operatingSystem: 'Windows',
      url: SITE.url,
      publisher: { '@id': `${SITE.url}/#organization` },
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'RUB',
        lowPrice: String(Math.min(...prices)),
        highPrice: String(Math.max(...prices)),
        offerCount: String(PLANS.length),
        availability: 'https://schema.org/InStock',
        url: SITE.url,
      },
    },
    {
      '@type': 'FAQPage',
      '@id': `${SITE.url}/#faq`,
      inLanguage: SITE.lang,
      mainEntity: faqEntries.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
} as const;
