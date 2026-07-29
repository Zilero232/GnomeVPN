import type { Release } from '@gnomevpn/schemas';

import { api } from '../http';

export const getLatestRelease = async (): Promise<Release> => {
  const { data } = await api.get('/release/latest');

  return data;
};
