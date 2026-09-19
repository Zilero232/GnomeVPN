import { describe, expect, it } from 'vitest';

import { pinnedFingerprint } from '../hysteria2.helpers';

const HEX = 'a'.repeat(64);

describe('pinnedFingerprint', () => {
  it('strips the colons openssl prints, which a core reading the pin does not expect', () => {
    const colonised = (HEX.match(/.{2}/g) ?? []).join(':').toUpperCase();

    expect(pinnedFingerprint(colonised)).toBe(HEX);
  });

  it('lowercases the digest, because the pin is compared as a string and not as bytes', () => {
    expect(pinnedFingerprint(HEX.toUpperCase())).toBe(HEX);
  });

  it('passes an already normalised digest through untouched', () => {
    expect(pinnedFingerprint(HEX)).toBe(HEX);
  });

  it('refuses a digest that is not a sha-256, rather than pinning a value no core can match', () => {
    expect(pinnedFingerprint('AA:BB:CC')).toBeNull();
    expect(pinnedFingerprint(Buffer.from(HEX, 'hex').toString('base64'))).toBeNull();
  });
});
