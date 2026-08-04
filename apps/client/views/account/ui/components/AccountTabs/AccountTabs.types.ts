import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type AccountTab = {
  value: string;
  label: string;
  icon: LucideIcon;
  render: () => ReactNode;
  isBare?: boolean;
};

export type AccountTabsProps = {
  items: AccountTab[];
  panelClassName?: string;
};
