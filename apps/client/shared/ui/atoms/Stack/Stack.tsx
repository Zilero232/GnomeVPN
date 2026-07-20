import { stack } from './Stack.variants';

import type { StackProps } from './Stack.types';

export const Stack = ({
  as: Tag = 'div',
  gap = 'md',
  className,
  children,
  ...props
}: StackProps) => (
  <Tag className={stack({ gap, class: className })} {...props}>
    {children}
  </Tag>
);
