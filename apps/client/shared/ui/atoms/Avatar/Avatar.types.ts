import type { ComponentProps } from 'react';

export type AvatarProps = Omit<ComponentProps<'span'>, 'children'> & {
  seed: string;
  size?: number;
  alt?: string;
};
