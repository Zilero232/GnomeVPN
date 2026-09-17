import { describe, expect, it } from 'vitest';

import { clientPlatform } from '../client-platform';

describe('clientPlatform', () => {
  it('reads the platform and version out of the INCY user agent', () => {
    expect(clientPlatform('INCY/1.4.2/ios')).toBe('INCY ios 1.4.2');
  });

  it('reports nothing when the request carries no user agent', () => {
    expect(clientPlatform(null)).toBeNull();
  });

  it('keeps an unrecognised agent so support can still see what fetched', () => {
    expect(clientPlatform('curl/8.4.0')).toBe('curl/8.4.0');
  });

  it('bounds an unrecognised agent, which is attacker-controlled', () => {
    expect(clientPlatform('x'.repeat(500))?.length).toBe(64);
  });
});
