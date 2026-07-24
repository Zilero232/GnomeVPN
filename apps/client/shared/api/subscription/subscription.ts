import { api } from '../http';

import type { SubscriptionStatus } from '@gnomevpn/schemas';

export const getSubscriptionStatus = async (): Promise<SubscriptionStatus> => {
  const { data } = await api.get('/subscription/status');

  return data;
};
