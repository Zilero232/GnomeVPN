import { clsx } from 'clsx';

import type { SubmitButtonProps } from './SubmitButton.types';

import { Button, Spinner } from '../../atoms';

import s from './SubmitButton.module.scss';

export const SubmitButton = ({ isPending = false, disabled, size = 'lg', type = 'submit', children, className, ...props }: SubmitButtonProps) => (
  <Button aria-busy={isPending} className={clsx(s.root, className)} disabled={disabled || isPending} size={size} type={type} {...props}>
    <span aria-hidden className={clsx(s.spinner, isPending && s.visible)}>
      <Spinner />
    </span>

    <span className={clsx(s.label, isPending && s.hidden)}>{children}</span>
  </Button>
);
