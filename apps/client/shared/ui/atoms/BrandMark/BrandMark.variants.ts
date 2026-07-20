import { cva } from 'class-variance-authority';

import s from './BrandMark.module.scss';

export const brandMark = cva(s.root, {
  variants: {
    size: { sm: s.sm, md: s.md, lg: s.lg },
    tone: { default: '', muted: s.muted },
  },
  defaultVariants: { size: 'md', tone: 'default' },
});
