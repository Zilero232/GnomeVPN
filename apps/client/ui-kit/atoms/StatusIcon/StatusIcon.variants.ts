import { cva } from 'class-variance-authority';

import s from './StatusIcon.module.scss';

export const statusIcon = cva(s.root, {
  variants: {
    tone: { accent: s.accent, danger: s.danger, muted: s.muted }
  },
  defaultVariants: { tone: 'accent' }
});
