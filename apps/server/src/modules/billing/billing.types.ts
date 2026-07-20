import type { PlanId } from '@gnomevpn/schemas';

export type PaymentMethodRef = {
  id: string;
  title: string | null;
};

export type ActivateInput = {
  userId: string;
  planId: PlanId;
  method: PaymentMethodRef | null;
};

export type AttachMethodInput = {
  userId: string;
  paymentMethodId: string;
  title: string | null;
};

export type AutoRenewInput = {
  hasMethod: boolean;
  wasCancelled: boolean;
};
