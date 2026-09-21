export type TrialState = {
  isTrial: boolean;
  isTrialAvailable: boolean;
};

export type TrialRow = {
  currentPeriodEnd: Date | null;
  trialStartedAt: Date | null;
};

export type TrialEligibility = 'available' | 'emailUnverified' | 'used';
