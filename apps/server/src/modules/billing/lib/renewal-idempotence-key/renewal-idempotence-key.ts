import type { RenewalIdempotenceKeyInput } from './renewal-idempotence-key.types';

export const renewalIdempotenceKey = ({ userId, currentPeriodEnd }: RenewalIdempotenceKeyInput): string =>
  `renew-${userId}-${currentPeriodEnd.toISOString()}`;
