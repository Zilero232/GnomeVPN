import { FINGERPRINT_SEPARATORS, SHA256_HEX } from './hysteria2.constants';

export const pinnedFingerprint = (fingerprint: string): string | null => {
  const normalised = fingerprint.replace(FINGERPRINT_SEPARATORS, '').toLowerCase();

  return SHA256_HEX.test(normalised) ? normalised : null;
};
