import type { ButtonProps } from './Button.types';

import { button } from './Button.variants';

export const Button = ({ variant = 'primary', size = 'md', type = 'button', className, children, ...props }: ButtonProps) => (
  <button className={button({ variant, size, class: className })} type={type} {...props}>
    {children}
  </button>
);
