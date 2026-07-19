import { clsx } from 'clsx';

import s from './Stack.module.scss';

import type { StackProps } from './Stack.types';

export const Stack = ({
  as: Tag = 'div',
  gap = 'md',
  className,
  children,
  ...props
}: StackProps) => (
  <Tag className={clsx(s.root, s[gap], className)} {...props}>
    {children}
  </Tag>
);
