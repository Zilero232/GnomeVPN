import { cva } from 'class-variance-authority';

import s from './Text.module.scss';

export const text = cva(s.root, {
  variants: {
    size: { xs: s.xs, sm: s.sm, md: s.md },
    tone: { default: '', muted: s.muted, danger: s.danger, success: s.success },
    align: { left: '', center: s.center },
  },
  defaultVariants: { size: 'md', tone: 'default', align: 'left' },
});
