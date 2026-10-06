import { createHash } from 'node:crypto';

import type { RenewalIdempotenceKeyInput } from './renewal-idempotence-key.types';

export const renewalIdempotenceKey = ({ userId, currentPeriodEnd, paymentMethodId, amountRub }: RenewalIdempotenceKeyInput): string => {
  const seed = [userId, currentPeriodEnd.toISOString(), paymentMethodId, amountRub.toFixed(2)].join('|');

  return createHash('sha256').update(seed).digest('base64url');
};
