import type { Variants } from 'motion/react';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const REVEAL_VIEWPORT = { once: true, amount: 0.2 } as const;

export const SECTION_MOTION: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT, staggerChildren: 0.08 }
  }
};

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

export const ROW_MOTION: Variants = {
  hidden: { opacity: 0, x: -18 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } }
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
