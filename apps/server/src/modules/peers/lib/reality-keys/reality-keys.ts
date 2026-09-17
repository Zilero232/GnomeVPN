import { x25519 } from '@noble/curves/ed25519.js';
import { randomBytes } from 'node:crypto';

import type { RealityKeyPair } from './reality-keys.types';

import { REALITY_SHORT_ID_BYTES } from '../../config';

export const generateRealityKeys = (): RealityKeyPair => {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);

  return {
    privateKey: Buffer.from(privateKey).toString('base64url'),
    publicKey: Buffer.from(publicKey).toString('base64url')
  };
};

export const generateRealityShortId = (): string => randomBytes(REALITY_SHORT_ID_BYTES).toString('hex');
