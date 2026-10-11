import type { PeriodKind } from '@gnomevpn/schemas';

import { TRIAL_DAYS } from '@gnomevpn/schemas';
import { addDays } from 'date-fns';
import { isNonNullish } from 'remeda';

import type { TrialRow, TrialState } from '../../subscription.types';

import { isPeriodActive } from '../../../../common/lib';

const isTrialPeriod = (row: TrialRow | null): boolean => {
  if (!row?.trialStartedAt || !row.currentPeriodEnd) {
    return false;
  }

  return row.currentPeriodEnd <= addDays(row.trialStartedAt, TRIAL_DAYS);
};

export const periodKind = (row: TrialRow | null): PeriodKind => {
  if (!isPeriodActive(row?.currentPeriodEnd)) {
    return 'none';
  }

  return isTrialPeriod(row) ? 'trial' : 'paid';
};

export const trialState = (row: TrialRow | null): TrialState => ({
  period: periodKind(row),
  isTrialAvailable: !isNonNullish(row?.trialStartedAt) && !isNonNullish(row?.currentPeriodEnd)
});
