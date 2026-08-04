import type { ConnectRequest, DisconnectRequest, TunnelConfig } from '@gnomevpn/schemas';

import { tunnelConfigSchema } from '@gnomevpn/schemas';

import { api } from '../http';

export const connectTunnel = async ({ nodeId, deviceId, protocol }: ConnectRequest): Promise<TunnelConfig> => {
  const { data } = await api.post('/tunnel/connect', { nodeId, deviceId, protocol });

  return tunnelConfigSchema.parse(data);
};

export const disconnectTunnel = async ({ deviceId }: DisconnectRequest): Promise<void> => {
  await api.post('/tunnel/disconnect', { deviceId });
};
