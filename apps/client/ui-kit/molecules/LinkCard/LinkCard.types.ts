import type { LucideIcon } from 'lucide-react';
import type { ComponentProps } from 'react';

export type LinkCardProps = Omit<ComponentProps<'a'>, 'children'> & {
  label: string;
  hint?: string;
  icon?: LucideIcon;
  size?: 'md' | 'sm';
};
