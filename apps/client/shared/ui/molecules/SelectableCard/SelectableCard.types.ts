import type { ComponentProps } from 'react';

export type SelectableCardProps = ComponentProps<'button'> & {
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
};
