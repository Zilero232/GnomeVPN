import type { ComponentProps } from 'react';

export type ButtonProps = ComponentProps<'button'> & {
  variant?: 'danger' | 'ghost' | 'primary';
  size?: 'icon' | 'lg' | 'md';
};
