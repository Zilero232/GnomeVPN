import type { SubscriptionStatus } from '@gnomevpn/schemas';

import { api } from '../http';

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const { data } = await api.get('/subscription/status');

  return data;
};

export const claimTrial = async (): Promise<SubscriptionStatus> => {
  const { data } = await api.post('/subscription/trial');

  return data;
};
