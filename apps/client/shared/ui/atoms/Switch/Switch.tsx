import { clsx } from 'clsx';

import s from './Switch.module.scss';

import type { SwitchProps } from './Switch.types';

export const Switch = ({ isChecked, className }: SwitchProps) => (
  <span aria-hidden className={clsx(s.root, isChecked && s.checked, className)} />
);
