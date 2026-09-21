import { describe, expect, it } from 'vitest';

import { messages } from '@/shared/i18n';

import { FAQ_GROUPS, FAQ_HIGHLIGHTS, FAQ_QUESTIONS } from '../config';

describe('FAQ_QUESTIONS', () => {
  it('flattens every group without losing or repeating a question', () => {
    expect(FAQ_QUESTIONS).toHaveLength(FAQ_GROUPS.flatMap((group) => group.questions).length);
    expect(new Set(FAQ_QUESTIONS).size).toBe(FAQ_QUESTIONS.length);
  });
});

describe('FAQ_HIGHLIGHTS', () => {
  it('draws from the full set, so the landing page cannot show a question the FAQ page lacks', () => {
    expect(FAQ_HIGHLIGHTS.every((question) => FAQ_QUESTIONS.includes(question))).toBe(true);
  });
});

describe('translations', () => {
  it('answers every question in both locales', () => {
    for (const question of FAQ_QUESTIONS) {
      expect(messages.ru.faq.questions).toHaveProperty(question);
      expect(messages.en.faq.questions).toHaveProperty(question);
    }
  });

  it('names every group in both locales', () => {
    for (const { key } of FAQ_GROUPS) {
      expect(messages.ru.faq.groups).toHaveProperty(key);
      expect(messages.en.faq.groups).toHaveProperty(key);
    }
  });
});
