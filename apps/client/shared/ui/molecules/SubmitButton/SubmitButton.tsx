import { Button, Spinner } from '../../atoms';

import type { SubmitButtonProps } from './SubmitButton.types';

export const SubmitButton = ({
  isPending = false,
  disabled,
  size = 'lg',
  type = 'submit',
  children,
  ...props
}: SubmitButtonProps) => (
  <Button disabled={disabled || isPending} size={size} type={type} {...props}>
    {isPending && <Spinner />}
    {children}
  </Button>
);
