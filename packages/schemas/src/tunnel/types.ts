import type { z } from 'zod';
import type { connectInputSchema, issueConfigSchema, revokeConfigSchema } from './inputs';
import type { downloadedConfigSchema, tunnelConfigSchema } from './outputs';

export type ConnectRequest = z.infer<typeof connectInputSchema>;
export type TunnelConfig = z.infer<typeof tunnelConfigSchema>;
export type DownloadedConfig = z.infer<typeof downloadedConfigSchema>;
export type IssueConfigRequest = z.infer<typeof issueConfigSchema>;
export type RevokeConfigRequest = z.infer<typeof revokeConfigSchema>;
