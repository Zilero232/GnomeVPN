import type { StatusIconProps } from './StatusIcon.types';

import { statusIcon } from './StatusIcon.variants';

export const StatusIcon = ({ tone = 'accent', className, children, ...props }: StatusIconProps) => (
  <span aria-hidden className={statusIcon({ tone, class: className })} {...props}>
    {children}
  </span>
);
