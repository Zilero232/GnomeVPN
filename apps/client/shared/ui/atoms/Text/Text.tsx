import { text } from './Text.variants';

import type { TextProps } from './Text.types';

export const Text = ({
  size = 'md',
  tone = 'default',
  align = 'left',
  className,
  children,
  ...props
}: TextProps) => (
  <p className={text({ size, tone, align, class: className })} {...props}>
    {children}
  </p>
);
