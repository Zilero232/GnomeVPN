import type { z } from 'zod';

import type { connectInputSchema, disconnectInputSchema, issueConfigSchema, revokeConfigSchema } from './inputs';
import type {
  downloadedConfigSchema,
  splitConfigSchema,
  splitModeSchema,
  tunnelConfigSchema,
  tunnelProtocolSchema,
  wireguardConfigSchema
} from './outputs';

export type ConnectRequest = z.infer<typeof connectInputSchema>;
export type DisconnectRequest = z.infer<typeof disconnectInputSchema>;
export type TunnelConfig = z.infer<typeof tunnelConfigSchema>;
export type TunnelProtocol = z.infer<typeof tunnelProtocolSchema>;
export type WireguardConfig = z.infer<typeof wireguardConfigSchema>;
export type DownloadedConfig = z.infer<typeof downloadedConfigSchema>;
export type IssueConfigRequest = z.infer<typeof issueConfigSchema>;
export type RevokeConfigRequest = z.infer<typeof revokeConfigSchema>;
export type SplitMode = z.infer<typeof splitModeSchema>;
export type SplitConfig = z.infer<typeof splitConfigSchema>;
