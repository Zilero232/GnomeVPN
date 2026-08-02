import { clsx } from 'clsx';

import type { SubmitButtonProps } from './SubmitButton.types';

import { Button, Spinner } from '../../atoms';

import s from './SubmitButton.module.scss';

export const SubmitButton = ({ isPending = false, disabled, size = 'lg', type = 'submit', children, className, ...props }: SubmitButtonProps) => (
  <Button className={clsx(s.root, className)} disabled={disabled || isPending} size={size} type={type} {...props}>
    <span className={clsx(s.spinner, isPending && s.visible)}>
      <Spinner />
    </span>

    {children}
  </Button>
);
