import type { ReactNode } from 'react';

export type TabItem = {
  value: string;
  label: ReactNode;
  content: ReactNode;
  // Set when a tab brings its own panels and must not sit inside the shared
  // card, which would nest one panel in another.
  isBare?: boolean;
};

export type TabsProps = {
  items: TabItem[];
  defaultValue?: string;
  className?: string;
  panelClassName?: string;
};
