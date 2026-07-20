import type { DownloadedConfig } from '@gnomevpn/schemas';

export type ConfigRowProps = {
  config: DownloadedConfig;
  isPending: boolean;
  onRedownload: () => void;
  onRevoke: () => void;
};
