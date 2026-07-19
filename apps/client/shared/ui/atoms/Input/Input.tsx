import { clsx } from 'clsx';

import s from './Input.module.scss';

import type { InputProps } from './Input.types';

export const Input = ({ className, type = 'text', ...props }: InputProps) => (
  <input className={clsx(s.root, className)} type={type} {...props} />
);
