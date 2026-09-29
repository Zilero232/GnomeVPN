import type { PlanId } from '@gnomevpn/schemas';

export type EndingSubscription = {
  id: string;
  userId: string;
  plan: PlanId;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  savedCardId: string | null;
  savedCardTitle: string | null;
  trialStartedAt: Date | null;
  reminderSentFor: Date | null;
};
