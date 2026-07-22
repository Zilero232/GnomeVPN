import { generateKeyPairSync, randomBytes } from 'node:crypto';

import {
  CLAMP_FIRST_BYTE_MASK,
  CLAMP_LAST_BYTE_BIT,
  CLAMP_LAST_BYTE_MASK,
  PKCS8_HEADER_LEN,
  SHORT_ID_BYTES,
  SPKI_HEADER_LEN,
} from './reality-keys.constants';

import type { RealityKeyPair } from './reality-keys.types';

// RFC 7748 clamping. `node:crypto` stores the scalar unclamped and only clamps
// while deriving the public key, so an exported private key and its public key
// agree here but not on the node: Xray feeds the stored scalar to curve25519 as
// it is, reaches a different shared secret, and answers every client with
// "handshake did not complete successfully" — a node that completes TCP, serves
// the donor's certificate on fallback, and carries no tunnel traffic at all.
const clamp = (scalar: Buffer): Buffer => {
  const clamped = Buffer.from(scalar);

  clamped[0] &= CLAMP_FIRST_BYTE_MASK;
  clamped[31] &= CLAMP_LAST_BYTE_MASK;
  clamped[31] |= CLAMP_LAST_BYTE_BIT;

  return clamped;
};

export const generateRealityKeys = (): RealityKeyPair => {
  const { publicKey, privateKey } = generateKeyPairSync('x25519');

  const privateDer = privateKey.export({ type: 'pkcs8', format: 'der' });
  const publicDer = publicKey.export({ type: 'spki', format: 'der' });

  return {
    privateKey: clamp(privateDer.subarray(PKCS8_HEADER_LEN)).toString('base64url'),
    publicKey: publicDer.subarray(SPKI_HEADER_LEN).toString('base64url'),
  };
};

export const generateShortId = (): string => randomBytes(SHORT_ID_BYTES).toString('hex');
