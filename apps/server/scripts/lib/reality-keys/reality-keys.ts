import { generateKeyPairSync, randomBytes } from 'node:crypto';

import { PKCS8_HEADER_LEN, SHORT_ID_BYTES, SPKI_HEADER_LEN } from './reality-keys.constants';

import type { RealityKeyPair } from './reality-keys.types';

export const generateRealityKeys = (): RealityKeyPair => {
  const { publicKey, privateKey } = generateKeyPairSync('x25519');

  const privateDer = privateKey.export({ type: 'pkcs8', format: 'der' });
  const publicDer = publicKey.export({ type: 'spki', format: 'der' });

  return {
    privateKey: privateDer.subarray(PKCS8_HEADER_LEN).toString('base64url'),
    publicKey: publicDer.subarray(SPKI_HEADER_LEN).toString('base64url'),
  };
};

export const generateShortId = (): string => randomBytes(SHORT_ID_BYTES).toString('hex');
