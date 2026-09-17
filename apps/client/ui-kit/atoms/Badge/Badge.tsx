import type { BadgeProps } from './Badge.types';

import { badge } from './Badge.variants';

export const Badge = ({ tone = 'accent', className, children, ...props }: BadgeProps) => (
  <span className={badge({ tone, class: className })} {...props}>
    {children}
  </span>
);
