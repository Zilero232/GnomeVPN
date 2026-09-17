import type { SubscriptionLink } from '@gnomevpn/schemas';

import { api } from '../http';

export const getSubscriptionLink = async (): Promise<SubscriptionLink> => {
  const { data } = await api.get('/subscription-link');

  return data;
};

export const rotateSubscriptionLink = async (): Promise<SubscriptionLink> => {
  const { data } = await api.post('/subscription-link/rotate');

  return data;
};
