import { describe, expect, it } from 'vitest';

import { headerValue } from '../header-value';
import { BASE64_PREFIX } from '../header-value.constants';

describe('headerValue', () => {
  it('passes ascii through untouched', () => {
    expect(headerValue('GnomeVPN')).toBe('GnomeVPN');
  });

  it('base64-encodes non-ascii, which http headers cannot carry', () => {
    const encoded = headerValue('Подписка');

    expect(encoded.startsWith(BASE64_PREFIX)).toBe(true);
    expect(Buffer.from(encoded.slice(BASE64_PREFIX.length), 'base64').toString('utf8')).toBe('Подписка');
  });

  it('leaves an empty value alone rather than encoding nothing', () => {
    expect(headerValue('')).toBe('');
  });
});
