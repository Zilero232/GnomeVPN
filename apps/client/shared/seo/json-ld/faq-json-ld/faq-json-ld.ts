import type { FaqJsonLdInput } from './faq-json-ld.types';

export const faqJsonLd = ({ entries }: FaqJsonLdInput) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: entries.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: { '@type': 'Answer', text: answer }
  }))
});
