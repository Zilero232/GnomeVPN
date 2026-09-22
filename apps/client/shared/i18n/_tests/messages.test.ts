import { apiErrorCodeSchema } from '@gnomevpn/schemas';
import { describe, expect, it } from 'vitest';

import { LOCALES } from '../locale';
import { messages } from '../messages';

const keysOf = (value: unknown, prefix = ''): string[] => {
  if (typeof value !== 'object' || value === null) {
    return [prefix];
  }

  return Object.entries(value).flatMap(([key, nested]) => keysOf(nested, prefix ? `${prefix}.${key}` : key));
};

describe('messages', () => {
  it('carries every locale the router serves', () => {
    expect(Object.keys(messages).sort()).toEqual([...LOCALES].sort());
  });

  it('holds the same keys in every locale, so no page falls back to a raw key', () => {
    const [reference, ...rest] = LOCALES.map((locale) => keysOf(messages[locale]).sort());

    for (const keys of rest) {
      expect(keys).toEqual(reference);
    }
  });

  it('names every error code the API can answer with, and invents none', () => {
    for (const locale of LOCALES) {
      expect(Object.keys(messages[locale].errors).sort()).toEqual([...apiErrorCodeSchema.options].sort());
    }
  });

  it('leaves no value empty', () => {
    for (const locale of LOCALES) {
      const empty = keysOf(messages[locale]).filter((key) => {
        const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], messages[locale]);

        return typeof value === 'string' && value.trim() === '';
      });

      expect(empty).toEqual([]);
    }
  });
});
