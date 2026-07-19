import { clsx } from 'clsx';

import s from './Spinner.module.scss';

import type { SpinnerProps } from './Spinner.types';

export const Spinner = ({ className }: SpinnerProps) => (
  <span aria-hidden className={clsx(s.root, className)} />
);
