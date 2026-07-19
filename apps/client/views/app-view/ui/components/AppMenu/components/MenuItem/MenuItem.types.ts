import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type MenuItemProps = {
  label: string;
  icon?: LucideIcon;
  trailing?: ReactNode;
  tone?: 'default' | 'danger';
  isPressed?: boolean;
  onClick: () => void;
};
