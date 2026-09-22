import type { ComponentProps } from 'react';

export type StatusIconProps = ComponentProps<'span'> & {
  tone?: 'accent' | 'danger' | 'muted';
};
