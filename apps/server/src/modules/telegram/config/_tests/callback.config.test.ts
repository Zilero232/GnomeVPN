import { entries, values } from 'remeda';
import { describe, expect, it } from 'vitest';

import { CALLBACK_PREFIX } from '../callback.config';

describe('CALLBACK_PREFIX', () => {
  it('gives every concern its own prefix', () => {
    const all = values(CALLBACK_PREFIX);

    expect(new Set(all).size).toBe(all.length);
  });

  // A payload is routed by the prefix it starts with, so one prefix that begins
  // with another would send its callbacks to the wrong handler.
  it('has no prefix that begins with another', () => {
    for (const [name, prefix] of entries(CALLBACK_PREFIX)) {
      for (const [otherName, other] of entries(CALLBACK_PREFIX)) {
        if (name !== otherName) {
          expect(other.startsWith(prefix), `${otherName} (${other}) starts with ${name} (${prefix})`).toBe(false);
        }
      }
    }
  });

  it('ends every prefix with a separator, so a value cannot run into it', () => {
    for (const prefix of values(CALLBACK_PREFIX)) {
      expect(prefix.endsWith(':')).toBe(true);
    }
  });
});
