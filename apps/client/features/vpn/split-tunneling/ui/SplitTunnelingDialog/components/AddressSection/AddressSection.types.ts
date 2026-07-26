import type { SplitConfig, SplitMode } from '@gnomevpn/schemas';

export type AddressSectionProps = {
  draft: SplitConfig;
  setIpsMode: (mode: SplitMode) => void;
  addIp: (cidr: string) => void;
  removeIp: (cidr: string) => void;
};
