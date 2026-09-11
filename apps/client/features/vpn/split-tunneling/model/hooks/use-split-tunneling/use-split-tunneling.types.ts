import type { SplitConfig, SplitMode } from '@gnomevpn/schemas';

export type UseSplitTunnelingInput = {
  isOpen?: boolean;
  onApplied?: () => Promise<void> | void;
};

export type UseSplitTunneling = {
  addIp: (ip: string) => void;
  applied: SplitConfig;
  apply: () => Promise<boolean>;
  clear: () => void;
  draft: SplitConfig;
  isApplying: boolean;
  isDirty: boolean;
  removeIp: (ip: string) => void;
  reset: () => void;
  setAppsMode: (mode: SplitMode) => void;
  setIpsMode: (mode: SplitMode) => void;
  toggleApp: (path: string) => void;
};
