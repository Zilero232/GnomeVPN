import { x25519 } from '@noble/curves/ed25519.js';

import type { WireguardKeyPair } from './wg-keys.types';

export const generateWireguardKeys = (): WireguardKeyPair => {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);

  return {
    privateKey: Buffer.from(privateKey).toString('base64'),
    publicKey: Buffer.from(publicKey).toString('base64')
  };
};
