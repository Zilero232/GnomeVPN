import type { SplitMode } from '@gnomevpn/schemas';
import type { ReactNode } from 'react';

export type SplitModeToggleProps = {
  label: string;
  lead: string;
  mode: SplitMode;
  onModeChange: (mode: SplitMode) => void;
  aside?: ReactNode;
};
