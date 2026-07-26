import type { SplitConfig, SplitMode } from '@gnomevpn/schemas';

export type AppSectionProps = {
  isOpen: boolean;
  draft: SplitConfig;
  setAppsMode: (mode: SplitMode) => void;
  toggleApp: (path: string) => void;
  onPick: () => void;
};
