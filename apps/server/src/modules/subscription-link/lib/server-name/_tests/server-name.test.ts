import { describe, expect, it } from 'vitest';

import { serverName } from '../server-name';

describe('serverName', () => {
  it('prefixes the name with the country flag', () => {
    expect(serverName({ country: 'Netherlands', countryCode: 'NL', city: 'Amsterdam' })).toBe('🇳🇱 Netherlands Amsterdam');
  });

  it('drops the city when the node has none', () => {
    expect(serverName({ country: 'Netherlands', countryCode: 'NL', city: null })).toBe('🇳🇱 Netherlands');
  });

  it('falls back to the plain country when the code is not two letters', () => {
    expect(serverName({ country: 'Netherlands', countryCode: '', city: null })).toBe('Netherlands');
  });

  it('appends a suffix, which is how the two protocols stay apart in the list', () => {
    expect(serverName({ country: 'Netherlands', countryCode: 'NL', city: null, suffix: '· TCP' })).toBe('🇳🇱 Netherlands · TCP');
  });
});
