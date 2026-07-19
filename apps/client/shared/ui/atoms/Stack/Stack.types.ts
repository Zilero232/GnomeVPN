import type { ComponentProps, ElementType } from 'react';

export type StackProps = ComponentProps<'div'> & {
  as?: ElementType;
  gap?: 'sm' | 'md' | 'lg';
};
