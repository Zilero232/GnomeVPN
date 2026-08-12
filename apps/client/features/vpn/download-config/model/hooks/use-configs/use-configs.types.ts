import type { DownloadedConfig } from '@gnomevpn/schemas';

export type ConfigWithStatus = DownloadedConfig & {
  isOnline: boolean;
};
