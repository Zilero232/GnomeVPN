import type { DownloadedConfig } from '@gnomevpn/schemas';

export type ConfigRowProps = {
  config: DownloadedConfig;
  isBlocked?: boolean;
  isRevoking: boolean;
  onRevoke: () => void;
};
