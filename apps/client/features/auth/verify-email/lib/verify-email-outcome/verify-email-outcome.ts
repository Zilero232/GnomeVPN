import type { VerifyEmailErrorCode } from './verify-email-outcome.types';

const KNOWN_CODES: readonly string[] = ['TOKEN_EXPIRED', 'INVALID_TOKEN', 'USER_NOT_FOUND', 'INVALID_USER'] satisfies VerifyEmailErrorCode[];

const isKnownCode = (value: string): value is VerifyEmailErrorCode => KNOWN_CODES.includes(value);

export const verifyEmailErrorCode = (raw: string | null): VerifyEmailErrorCode | null => {
  if (!raw) {
    return null;
  }

  const code = raw.trim().toUpperCase();

  if (!code) {
    return null;
  }

  return isKnownCode(code) ? code : 'UNKNOWN';
};
