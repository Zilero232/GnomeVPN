import { cva } from 'class-variance-authority';

import s from './LinkCard.module.scss';

export const linkCard = cva(s.root, {
  variants: {
    size: { sm: s.sm, md: s.md }
  },
  defaultVariants: { size: 'md' }
});
