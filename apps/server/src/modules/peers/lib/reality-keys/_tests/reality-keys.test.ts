import { x25519 } from '@noble/curves/ed25519.js';
import { describe, expect, it } from 'vitest';

import { REALITY_SHORT_ID_BYTES } from '../../../config';
import { generateRealityKeys, generateRealityShortId } from '../reality-keys';

describe('generateRealityKeys', () => {
  it('derives the public half from the private one, which is what the client verifies against', () => {
    const { privateKey, publicKey } = generateRealityKeys();

    const derived = Buffer.from(x25519.getPublicKey(Buffer.from(privateKey, 'base64url'))).toString('base64url');

    expect(derived).toBe(publicKey);
  });

  it('encodes both halves url-safe, since the public key travels in a query parameter', () => {
    const { privateKey, publicKey } = generateRealityKeys();

    expect(encodeURIComponent(publicKey)).toBe(publicKey);
    expect(encodeURIComponent(privateKey)).toBe(privateKey);
  });

  it('never repeats a key pair', () => {
    const keys = Array.from({ length: 50 }, generateRealityKeys);

    expect(new Set(keys.map((key) => key.privateKey)).size).toBe(keys.length);
  });
});

describe('generateRealityShortId', () => {
  it('is hex of the configured length, which is what xray accepts', () => {
    expect(generateRealityShortId()).toMatch(new RegExp(`^[0-9a-f]{${REALITY_SHORT_ID_BYTES * 2}}$`));
  });

  it('never repeats', () => {
    const ids = Array.from({ length: 100 }, generateRealityShortId);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
