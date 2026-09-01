import { x25519 } from '@noble/curves/ed25519.js';
import { describe, expect, it } from 'vitest';

import { generateWireguardKeys } from '../wg-keys';

const BASE64_32_BYTES = /^[\d+/A-Za-z]{42}[048AEIMQUYcgkosw]=$/;

describe('generateWireguardKeys', () => {
  it('returns a base64 private key', () => {
    expect(generateWireguardKeys().privateKey).toMatch(BASE64_32_BYTES);
  });

  it('returns a base64 public key', () => {
    expect(generateWireguardKeys().publicKey).toMatch(BASE64_32_BYTES);
  });

  it('decodes both keys to thirty two bytes', () => {
    const { privateKey, publicKey } = generateWireguardKeys();

    expect(Buffer.from(privateKey, 'base64')).toHaveLength(32);
    expect(Buffer.from(publicKey, 'base64')).toHaveLength(32);
  });

  it('never returns the private key as the public key', () => {
    const { privateKey, publicKey } = generateWireguardKeys();

    expect(publicKey).not.toBe(privateKey);
  });

  it('returns a different pair on every call', () => {
    const first = generateWireguardKeys();
    const second = generateWireguardKeys();

    expect(first.privateKey).not.toBe(second.privateKey);
    expect(first.publicKey).not.toBe(second.publicKey);
  });

  it('derives the public key from the private key', () => {
    const { privateKey, publicKey } = generateWireguardKeys();
    const derived = Buffer.from(x25519.getPublicKey(Buffer.from(privateKey, 'base64'))).toString('base64');

    expect(derived).toBe(publicKey);
  });
});
