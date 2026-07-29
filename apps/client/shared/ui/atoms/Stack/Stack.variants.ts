import { cva } from 'class-variance-authority';

import s from './Stack.module.scss';

export const stack = cva(s.root, {
  variants: {
    gap: { sm: s.sm, md: s.md, lg: s.lg }
  },
  defaultVariants: { gap: 'md' }
});
