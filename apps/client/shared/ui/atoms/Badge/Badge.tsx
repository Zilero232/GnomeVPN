import { badge } from './Badge.variants';

import type { BadgeProps } from './Badge.types';

export const Badge = ({ tone = 'accent', className, children, ...props }: BadgeProps) => (
  <span className={badge({ tone, class: className })} {...props}>
    {children}
  </span>
);
