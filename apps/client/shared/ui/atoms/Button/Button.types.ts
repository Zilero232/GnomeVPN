import type { ComponentProps } from 'react';

export type ButtonProps = ComponentProps<'button'> & {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'icon' | 'md' | 'lg';
};
