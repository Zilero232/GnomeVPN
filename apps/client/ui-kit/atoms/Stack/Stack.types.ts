import type { ComponentProps, ElementType } from 'react';

export type StackProps = ComponentProps<'div'> & {
  as?: ElementType;
  gap?: 'lg' | 'md' | 'sm';
};
