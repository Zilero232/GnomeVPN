import { isNonNullish } from 'remeda';

import type { TrialRow, TrialState } from '../../subscription.types';

import { isPeriodActive } from '../../../../common/lib';

export const trialState = (row: TrialRow | null): TrialState => {
  const hadTrial = isNonNullish(row?.trialStartedAt);
  const hasPeriod = isNonNullish(row?.currentPeriodEnd);

  return {
    isTrial: hadTrial && isPeriodActive(row?.currentPeriodEnd),
    isTrialAvailable: !hadTrial && !hasPeriod
  };
};
