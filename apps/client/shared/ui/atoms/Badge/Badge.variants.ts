import { cva } from 'class-variance-authority';

import s from './Badge.module.scss';

export const badge = cva(s.root, {
  variants: {
    tone: { accent: s.accent, muted: s.muted },
  },
  defaultVariants: { tone: 'accent' },
});
