import { clsx } from 'clsx';

import type { SpinnerProps } from './Spinner.types';

import s from './Spinner.module.scss';

export const Spinner = ({ className }: SpinnerProps) => <span aria-hidden data-spinner className={clsx(s.root, className)} />;
