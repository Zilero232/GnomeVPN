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

export const ROW_MOTION: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } }
};
