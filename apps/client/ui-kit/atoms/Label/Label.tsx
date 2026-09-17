import { clsx } from 'clsx';

import type { LabelProps } from './Label.types';

import s from './Label.module.scss';

export const Label = ({ htmlFor, className, children, ...props }: LabelProps) => (
  <label className={clsx(s.root, className)} htmlFor={htmlFor} {...props}>
    {children}
  </label>
);
