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

export const trialState = (row: TrialRow | null): TrialState => {
  const hadTrial = isNonNullish(row?.trialStartedAt);
  const hasPeriod = isNonNullish(row?.currentPeriodEnd);

  return {
    isTrial: isTrialPeriod(row) && isPeriodActive(row?.currentPeriodEnd),
    isTrialAvailable: !hadTrial && !hasPeriod
  };
};
