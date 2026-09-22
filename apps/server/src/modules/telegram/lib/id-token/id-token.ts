import { createRemoteJWKSet, jwtVerify } from 'jose';
import { isNullish } from 'remeda';

import type { TelegramIdentity } from '../../telegram.types';
import type { VerifyIdTokenInput } from './id-token.types';

import { TELEGRAM_OIDC } from '../../config';

const jwks = createRemoteJWKSet(new URL(TELEGRAM_OIDC.jwksUrl));

const TELEGRAM_ID = /^\d{1,19}$/u;

export const verifyIdToken = async ({ idToken, clientId }: VerifyIdTokenInput): Promise<TelegramIdentity> => {
  const { payload } = await jwtVerify(idToken, jwks, {
    issuer: TELEGRAM_OIDC.issuer,
    audience: clientId,
    clockTolerance: TELEGRAM_OIDC.clockToleranceSeconds
  });

  const { sub } = payload;

  if (isNullish(sub) || !TELEGRAM_ID.test(sub)) {
    throw new TypeError('the id token names no Telegram account');
  }

  return {
    telegramId: BigInt(sub),
    username: typeof payload.preferred_username === 'string' ? payload.preferred_username : null,
    languageCode: null
  };
};
