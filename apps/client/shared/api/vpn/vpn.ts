import { api } from '../http';

import type {
  BindCardResult,
  CheckoutResult,
  Node,
  PlanId,
  Release,
  SubscriptionStatus,
  TunnelConfig,
} from '@gnomevpn/schemas';

export const listNodes = async (): Promise<Node[]> => {
  const { data } = await api.get('/nodes');
  return data;
};

export const connectTunnel = async (nodeId: string): Promise<TunnelConfig> => {
  const { data } = await api.post('/tunnel/connect', { nodeId });
  return data;
};

export const disconnectTunnel = async (): Promise<void> => {
  await api.post('/tunnel/disconnect');
};

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const { data } = await api.get('/subscription/status');
  return data;
};

export const createCheckout = async (planId: PlanId): Promise<CheckoutResult> => {
  const { data } = await api.post('/billing/checkout', { planId });
  return data;
};

export const cancelAutoRenew = async (): Promise<void> => {
  await api.post('/billing/cancel');
};

export const resumeAutoRenew = async (): Promise<void> => {
  await api.post('/billing/resume');
};

export const bindCard = async (): Promise<BindCardResult> => {
  const { data } = await api.post('/billing/bind-card');
  return data;
};

export const unbindCard = async (): Promise<void> => {
  await api.post('/billing/unbind-card');
};

export const getLatestRelease = async (): Promise<Release> => {
  const { data } = await api.get('/release/latest');
  return data;
};
