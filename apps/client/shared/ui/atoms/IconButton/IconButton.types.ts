import type { ComponentProps } from 'react';

export type IconButtonProps = ComponentProps<'button'> & {
  size?: 'sm' | 'md';
  tone?: 'muted' | 'danger';
  'aria-label': string;
};
