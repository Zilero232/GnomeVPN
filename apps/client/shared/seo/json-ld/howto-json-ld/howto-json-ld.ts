import type { HowToJsonLdInput } from './howto-json-ld.types';

export const howToJsonLd = ({ name, description, steps }: HowToJsonLdInput) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name,
  description,
  step: steps.map(({ name: stepName, text }, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: stepName,
    text
  }))
});
