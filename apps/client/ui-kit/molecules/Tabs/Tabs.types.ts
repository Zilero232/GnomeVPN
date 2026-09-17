import type { ReactNode } from 'react';

export type TabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
  isBare?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
  panelClassName?: string;
};
