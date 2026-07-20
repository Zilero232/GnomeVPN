import { cva } from 'class-variance-authority';

import s from './SelectableCard.module.scss';

export const selectableCard = cva(s.root, {
  variants: {
    size: { sm: s.sm, md: s.md, lg: s.lg },
    isSelected: { true: s.selected, false: '' },
  },
  defaultVariants: { size: 'md', isSelected: false },
});
