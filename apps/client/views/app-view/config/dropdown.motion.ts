import type { Variants } from 'motion/react';

export const MENU_MOTION = {
  initial: { opacity: 0, scale: 0.94, y: -8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -6, transition: { duration: 0.12 } },
  transition: { type: 'spring', stiffness: 500, damping: 30, staggerChildren: 0.035 }
} as const;

export const MENU_ITEM_MOTION: Variants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 }
};
