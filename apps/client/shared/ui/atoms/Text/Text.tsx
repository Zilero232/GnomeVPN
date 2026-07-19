import { clsx } from 'clsx';

import s from './Text.module.scss';

import type { TextProps } from './Text.types';

export const Text = ({
  size = 'md',
  tone = 'default',
  align = 'left',
  className,
  children,
  ...props
}: TextProps) => (
  <p
    className={clsx(
      s.root,
      s[size],
      tone !== 'default' && s[tone],
      align === 'center' && s.center,
      className,
    )}
    {...props}
  >
    {children}
  </p>
);
