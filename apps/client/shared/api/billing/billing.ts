import type { BindCardResult, BuyExtraDevicesInput, CheckoutResult, CreateCheckoutInput } from '@gnomevpn/schemas';

import { api } from '../http';

export const createCheckout = async ({ planId }: CreateCheckoutInput): Promise<CheckoutResult> => {
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

export const buyExtraDevices = async ({ quantity }: BuyExtraDevicesInput): Promise<CheckoutResult> => {
  const { data } = await api.post('/billing/extra-devices', { quantity });

  return data;
};
