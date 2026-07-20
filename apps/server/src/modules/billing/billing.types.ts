import type { PlanId } from '@gnomevpn/schemas';

export type ActivateInput = {
  userId: string;
  planId: PlanId;
  method: { id: string; title: string | null } | null;
};

export type AttachMethodInput = {
  userId: string;
  paymentMethodId: string;
  title: string | null;
};
