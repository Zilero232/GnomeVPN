import { tunnelConfigSchema } from '@gnomevpn/schemas';

import { api } from '../http';

import type {
  ConnectRequest,
  DeviceUsage,
  DisconnectRequest,
  HeartbeatRequest,
  TunnelConfig,
} from '@gnomevpn/schemas';

export const getDeviceUsage = async (deviceId: string): Promise<DeviceUsage> => {
  const { data } = await api.get('/tunnel/devices', { params: { deviceId } });

  return data;
};

export const connectTunnel = async ({
  nodeId,
  deviceId,
}: ConnectRequest): Promise<TunnelConfig> => {
  const { data } = await api.post('/tunnel/connect', { nodeId, deviceId });

  return tunnelConfigSchema.parse(data);
};

export const disconnectTunnel = async ({ deviceId }: DisconnectRequest): Promise<void> => {
  await api.post('/tunnel/disconnect', { deviceId });
};

export const sendHeartbeat = async ({ deviceId }: HeartbeatRequest): Promise<void> => {
  await api.post('/tunnel/heartbeat', { deviceId });
};
