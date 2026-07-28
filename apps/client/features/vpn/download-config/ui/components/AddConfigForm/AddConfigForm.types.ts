import type { DownloadedConfig, Node } from '@gnomevpn/schemas';

export type AddConfigFormProps = {
  nodes: Node[];
  configs: DownloadedConfig[];
  isFull: boolean;
  isDisabled: boolean;
};
