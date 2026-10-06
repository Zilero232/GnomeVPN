import type { PlanId } from '@gnomevpn/schemas';

export type DueSubscription = {
  userId: string;
  savedCardId: string | null;
  plan: PlanId;
  currentPeriodEnd: Date | null;
  trialStartedAt: Date | null;
};

export type ChargeAttemptInput = {
  userId: string;
  currentPeriodEnd: Date;
};
