import { cva } from 'class-variance-authority';

import s from './IconButton.module.scss';

export const iconButton = cva(s.root, {
  variants: {
    size: { sm: s.sm, md: s.md },
    tone: { muted: s.muted, danger: s.danger }
  },
  defaultVariants: { size: 'md', tone: 'muted' }
});
