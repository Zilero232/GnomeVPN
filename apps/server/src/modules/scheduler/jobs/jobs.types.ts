import type { PlanId } from '@gnomevpn/schemas';

export type PeerRow = {
  id: string;
  wgEasyClientId: string;
  createdAt: Date;
  lastHandshakeAt: Date | null;
  node: { wgEasyUrl: string; wgEasyApiKeyRef: string };
};

export type PeerAccessRow = {
  userId: string;
  user: {
    subscription: { status: string; currentPeriodEnd: Date | null } | null;
  };
};

export type ProbeNodeRow = {
  id: string;
  wgEasyUrl: string;
  wgEasyApiKeyRef: string;
};

export type DueSubscription = {
  userId: string;
  yookassaPaymentMethodId: string | null;
  plan: PlanId;
};
