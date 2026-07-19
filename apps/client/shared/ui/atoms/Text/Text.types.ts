import type { ComponentProps } from 'react';

export type TextProps = ComponentProps<'p'> & {
  size?: 'xs' | 'sm' | 'md';
  tone?: 'default' | 'muted' | 'danger' | 'success';
  align?: 'left' | 'center';
};
