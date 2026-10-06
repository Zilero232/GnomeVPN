import { timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';

import type { TimingSafeEqualInput } from './timing-safe-equal.types';

export const timingSafeEqual = ({ actual, expected }: TimingSafeEqualInput): boolean => {
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);

  if (a.length !== b.length) {
    return false;
  }

  return nodeTimingSafeEqual(a, b);
};
