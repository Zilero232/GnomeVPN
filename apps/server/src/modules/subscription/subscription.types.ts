import type { PeriodKind } from '@gnomevpn/schemas';

export type TrialState = {
  period: PeriodKind;
  isTrialAvailable: boolean;
};

export type TrialRow = {
  currentPeriodEnd: Date | null;
  trialStartedAt: Date | null;
};

export type TrialEligibility = 'available' | 'emailUnverified' | 'used';

export type TrialStanding = {
  eligibility: TrialEligibility;
  hasAccess: boolean;
};
