import type { z } from 'zod';

import type { configStatusSchema, downloadedConfigSchema, issueConfigSchema, revokeConfigSchema } from './configs.schemas';

export type IssueConfigRequest = z.infer<typeof issueConfigSchema>;

export type RevokeConfigRequest = z.infer<typeof revokeConfigSchema>;

export type DownloadedConfig = z.infer<typeof downloadedConfigSchema>;

export type ConfigStatus = z.infer<typeof configStatusSchema>;
