import type { ComponentProps } from 'react';

export type IconButtonProps = ComponentProps<'button'> & {
  size?: 'md' | 'sm';
  tone?: 'danger' | 'muted';
  'aria-label': string;
};
