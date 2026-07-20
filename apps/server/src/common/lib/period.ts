import { addMonths, isAfter } from 'date-fns';

import type { PeriodInput } from './period.types';

export const isPeriodActive = (currentPeriodEnd: Date | null | undefined): boolean =>
  Boolean(currentPeriodEnd && isAfter(currentPeriodEnd, new Date()));

export const nextPeriodEnd = ({ currentPeriodEnd, months }: PeriodInput): Date => {
  const base = isPeriodActive(currentPeriodEnd) && currentPeriodEnd ? currentPeriodEnd : new Date();

  return addMonths(base, months);
};

export const resolveStatus = (currentPeriodEnd: Date | null | undefined): 'active' | 'expired' =>
  isPeriodActive(currentPeriodEnd) ? 'active' : 'expired';
