import type {
  BindCardResult,
  BuyExtraDevicesInput,
  CheckoutClient,
  CheckoutResult,
  PlanId
} from '@gnomevpn/schemas';

import { api } from '../http';

export const createCheckout = async (
  planId: PlanId,
  client: CheckoutClient
): Promise<CheckoutResult> => {
  const { data } = await api.post('/billing/checkout', { planId, client });

  return data;
};

export const cancelAutoRenew = async (): Promise<void> => {
  await api.post('/billing/cancel');
};

export const resumeAutoRenew = async (): Promise<void> => {
  await api.post('/billing/resume');
};

export const bindCard = async (client: CheckoutClient): Promise<BindCardResult> => {
  const { data } = await api.post('/billing/bind-card', { client });

  return data;
};

export const unbindCard = async (): Promise<void> => {
  await api.post('/billing/unbind-card');
};

export const buyExtraDevices = async ({
  quantity,
  client
}: BuyExtraDevicesInput): Promise<CheckoutResult> => {
  const { data } = await api.post('/billing/extra-devices', { quantity, client });

  return data;
};
