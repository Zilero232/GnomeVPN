import { cva } from 'class-variance-authority';

import s from './CountryFlag.module.scss';

export const countryFlag = cva(s.root, {
  variants: {
    size: { sm: s.sm, md: s.md, lg: s.lg },
  },
  defaultVariants: { size: 'md' },
});
