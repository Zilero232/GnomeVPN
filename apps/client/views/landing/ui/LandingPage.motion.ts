import type { Variants } from 'motion/react';

import { EASE_OUT } from '@/shared/lib';

export const TITLE_MOTION: Variants = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE_OUT }
  }
};

export const ITEM_MOTION: Variants = {
  hidden: { opacity: 0, y: 26, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 260, damping: 26 }
  }
};

export const STEP_MOTION: Variants = {
  hidden: { opacity: 0, x: -26 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 220, damping: 24 }
  }
};

export const CARD_HOVER = {
  rest: { y: 0 },
  hover: { y: -6, transition: { type: 'spring', stiffness: 400, damping: 24 } }
} as const;

export const ICON_HOVER = {
  rest: { rotate: 0, scale: 1 },
  hover: { rotate: -8, scale: 1.12, transition: { type: 'spring', stiffness: 500, damping: 18 } }
} as const;
