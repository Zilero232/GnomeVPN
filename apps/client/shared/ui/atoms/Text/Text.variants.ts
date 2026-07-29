import { cva } from 'class-variance-authority';

import s from './Text.module.scss';

export const text = cva(s.root, {
  variants: {
    size: { xs: s.xs, sm: s.sm, md: s.md, lg: s.lg, xl: s.xl },
    weight: {
      regular: s.regular,
      medium: s.medium,
      semibold: s.semibold,
      bold: s.bold
    },
    tone: {
      default: '',
      muted: s.muted,
      accent: s.accent,
      danger: s.danger,
      success: s.success
    },
    align: { left: s.left, center: s.center, right: s.right },
    mono: { true: s.mono },
    uppercase: { true: s.uppercase },
    truncate: { true: s.truncate }
  },
  defaultVariants: { size: 'md', tone: 'default' }
});
