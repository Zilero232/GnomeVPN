import { clsx } from 'clsx';

import s from './Button.module.scss';

import type { ButtonProps } from './Button.types';

export const Button = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  ...props
}: ButtonProps) => (
  <button className={clsx(s.root, s[variant], s[size], className)} type={type} {...props}>
    {children}
  </button>
);
