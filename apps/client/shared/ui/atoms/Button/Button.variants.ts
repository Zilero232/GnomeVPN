import { cva } from 'class-variance-authority';

import s from './Button.module.scss';

export const button = cva(s.root, {
  variants: {
    variant: { primary: s.primary, ghost: s.ghost, danger: s.danger },
    size: { md: s.md, lg: s.lg },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});
