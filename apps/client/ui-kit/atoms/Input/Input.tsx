import { clsx } from 'clsx';

import type { InputProps } from './Input.types';

import s from './Input.module.scss';

export const Input = ({ className, type = 'text', ...props }: InputProps) => <input className={clsx(s.root, className)} type={type} {...props} />;
