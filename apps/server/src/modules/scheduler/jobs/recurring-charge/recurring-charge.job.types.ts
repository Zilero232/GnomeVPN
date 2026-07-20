import type { PlanId } from '@gnomevpn/schemas';

export type DueSubscription = {
  userId: string;
  savedCardId: string | null;
  plan: PlanId;
};
