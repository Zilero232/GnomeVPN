import { describe, expect, it } from 'vitest';

import { formatDate } from '../format-date';

const iso = '2026-03-09T12:00:00.000Z';

describe('formatDate', () => {
  it('renders the date in the language it is asked for', () => {
    expect(formatDate({ iso, locale: 'ru' })).toContain('март');
    expect(formatDate({ iso, locale: 'en' })).toContain('March');
  });

  it('names the same day in both languages', () => {
    for (const locale of ['ru', 'en'] as const) {
      expect(formatDate({ iso, locale })).toContain('9');
      expect(formatDate({ iso, locale })).toContain('2026');
    }
  });

  it('renders nothing for a subscription that has no period', () => {
    expect(formatDate({ iso: null, locale: 'ru' })).toBe('');
  });
});
