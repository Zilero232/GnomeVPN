import { api } from '../http';

import type { Release } from '@gnomevpn/schemas';

export const getLatestRelease = async (): Promise<Release> => {
  const { data } = await api.get('/release/latest');

  return data;
};
