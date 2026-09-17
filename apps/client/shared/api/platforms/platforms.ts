import type { Platform } from '@gnomevpn/schemas';

import { api } from '../http';

export const listPlatforms = async (): Promise<Platform[]> => {
  const { data } = await api.get('/platforms');

  return data;
};
