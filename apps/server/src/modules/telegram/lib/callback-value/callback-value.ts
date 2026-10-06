import type { AutoRenewChoice } from '../../telegram.types';
import type { CountFromInput } from './callback-value.types';

import { AUTO_RENEW_CHOICE, CONFIRMED } from '../../config';
import { DIGITS } from './callback-value.constants';

export const isConfirmed = (raw: string): boolean => raw === CONFIRMED;

export const countFrom = ({ raw, max }: CountFromInput): number | null => {
  if (!DIGITS.test(raw)) {
    return null;
  }

  const parsed = Number(raw);

  return parsed > 0 && parsed <= max ? parsed : null;
};

export const autoRenewChoice = (raw: string): AutoRenewChoice | null => (raw === AUTO_RENEW_CHOICE.on || raw === AUTO_RENEW_CHOICE.off ? raw : null);
