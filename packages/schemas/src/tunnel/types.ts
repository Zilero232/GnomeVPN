import type { z } from 'zod';
import type {
  connectInputSchema,
  disconnectInputSchema,
  heartbeatInputSchema,
  issueConfigSchema,
  revokeConfigSchema,
} from './inputs';
import type { deviceUsageSchema, downloadedConfigSchema, tunnelConfigSchema } from './outputs';

export type ConnectRequest = z.infer<typeof connectInputSchema>;
export type DisconnectRequest = z.infer<typeof disconnectInputSchema>;
export type HeartbeatRequest = z.infer<typeof heartbeatInputSchema>;
export type TunnelConfig = z.infer<typeof tunnelConfigSchema>;
export type DownloadedConfig = z.infer<typeof downloadedConfigSchema>;
export type IssueConfigRequest = z.infer<typeof issueConfigSchema>;
export type RevokeConfigRequest = z.infer<typeof revokeConfigSchema>;
export type DeviceUsage = z.infer<typeof deviceUsageSchema>;
