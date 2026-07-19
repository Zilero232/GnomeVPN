import { clsx } from 'clsx';

import s from './Label.module.scss';

import type { LabelProps } from './Label.types';

export const Label = ({ htmlFor, className, children, ...props }: LabelProps) => (
  <label className={clsx(s.root, className)} htmlFor={htmlFor} {...props}>
    {children}
  </label>
);
