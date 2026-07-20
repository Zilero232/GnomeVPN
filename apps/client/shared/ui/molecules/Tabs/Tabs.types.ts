import type { ReactNode } from 'react';

export type TabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
};

export type TabsProps = {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
  panelClassName?: string;
};
