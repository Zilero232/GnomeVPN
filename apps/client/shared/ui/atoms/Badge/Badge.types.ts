import type { ComponentProps } from 'react';

export type BadgeProps = ComponentProps<'span'> & {
  tone?: 'accent' | 'muted';
};
