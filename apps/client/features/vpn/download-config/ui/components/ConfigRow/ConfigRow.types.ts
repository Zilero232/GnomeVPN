import type { DownloadedConfig } from '@gnomevpn/schemas';

export type ConfigRowProps = {
  config: DownloadedConfig;
  isPending: boolean;
  onCopy: () => void;
  onRedownload: () => void;
  onRevoke: () => void;
};
