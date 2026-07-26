import { text } from './Text.variants';

import type { ElementType } from 'react';
import type { TextElement, TextProps } from './Text.types';

export const Text = <As extends TextElement = 'p'>({
  as,
  size,
  weight,
  tone,
  align,
  mono,
  uppercase,
  truncate,
  className,
  children,
  ...props
}: TextProps<As>) => {
  const Tag = (as ?? 'p') as ElementType;

  return (
    <Tag
      className={text({ size, weight, tone, align, mono, uppercase, truncate, class: className })}
      {...props}
    >
      {children}
    </Tag>
  );
};
