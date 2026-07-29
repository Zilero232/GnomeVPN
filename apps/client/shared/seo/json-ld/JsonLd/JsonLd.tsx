import type { JsonLdProps } from './JsonLd.types';

export const JsonLd = ({ data }: JsonLdProps) => (
  <script
    // eslint-disable-next-line react/dom-no-dangerously-set-innerhtml -- JSON-LD has to be inlined as a raw script payload
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    type='application/ld+json'
  />
);
