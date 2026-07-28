import type { DownloadedConfig } from '@gnomevpn/schemas';

export type ConfigQrDialogProps = {
  config: DownloadedConfig;
  content: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};
