import type { DeviceIdParam, DeviceList } from '@gnomevpn/schemas';

import { api } from '../http';

export const getDevices = async (): Promise<DeviceList> => {
  const { data } = await api.get('/devices');

  return data;
};

export const removeDevice = async ({ id }: DeviceIdParam): Promise<void> => {
  await api.delete(`/devices/${encodeURIComponent(id)}`);
};
