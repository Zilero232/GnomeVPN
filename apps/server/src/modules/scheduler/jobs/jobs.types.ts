import type { PlanId } from '@gnomevpn/schemas';

export type PeerRow = {
  id: string;
  wgEasyClientId: string;
  createdAt: Date;
  lastHandshakeAt: Date | null;
  node: { wgEasyUrl: string; wgEasyApiKeyEnvVar: string };
};

export type ProbeNodeRow = {
  id: string;
  wgEasyUrl: string;
  wgEasyApiKeyEnvVar: string;
};

export type DueSubscription = {
  userId: string;
  savedCardId: string | null;
  plan: PlanId;
};
