import type { DownloadedConfig } from '@gnomevpn/schemas';

export type ConfigWithStatus = DownloadedConfig & {
  isBroken: boolean;
  isOnline: boolean;
};
