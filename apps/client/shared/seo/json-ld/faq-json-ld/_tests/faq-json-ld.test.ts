import { describe, expect, it } from 'vitest';

import { faqJsonLd } from '../faq-json-ld';

describe('faqJsonLd', () => {
  it('turns each entry into a question with its answer attached', () => {
    expect(faqJsonLd({ entries: [{ question: 'Q', answer: 'A' }] }).mainEntity).toEqual([
      { '@type': 'Question', name: 'Q', acceptedAnswer: { '@type': 'Answer', text: 'A' } }
    ]);
  });

  it('keeps the entries in the order they were given', () => {
    const entries = [
      { question: 'first', answer: 'a' },
      { question: 'second', answer: 'b' }
    ];

    expect(faqJsonLd({ entries }).mainEntity.map((entry) => entry.name)).toEqual(['first', 'second']);
  });
});
