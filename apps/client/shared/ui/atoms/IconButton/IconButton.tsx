import { iconButton } from './IconButton.variants';

import type { IconButtonProps } from './IconButton.types';

export const IconButton = ({
  size = 'md',
  tone = 'muted',
  type = 'button',
  className,
  children,
  ...props
}: IconButtonProps) => (
  <button className={iconButton({ size, tone, class: className })} type={type} {...props}>
    {children}
  </button>
);
