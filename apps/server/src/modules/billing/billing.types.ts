import type { CheckoutClient, Plan, PlanId } from '@gnomevpn/schemas';

import type { Prisma } from '../../../generated';

export type PrismaExecutor = Prisma.TransactionClient;

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

export type RecordPaymentInput = {
  userId: string;
  paymentId: string;
  plan: Plan;
  isAutoCharge: boolean;
};

export type GrantExtraDevicesInput = {
  userId: string;
  quantity: number;
};

export type BuyExtraDevicesServiceInput = {
  userId: string;
  quantity: number;
  client: CheckoutClient;
};
