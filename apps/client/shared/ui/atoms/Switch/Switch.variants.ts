import { cva } from 'class-variance-authority';

import s from './Switch.module.scss';

export const switchTrack = cva(s.root, {
  variants: {
    isChecked: { true: s.checked, false: '' },
  },
  defaultVariants: { isChecked: false },
});
