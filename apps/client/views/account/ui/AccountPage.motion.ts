import type { Variants } from 'motion/react';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export const PAGE_MOTION: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT, staggerChildren: 0.07 } }
};

export const HEADER_MOTION: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.55, ease: EASE_OUT } }
};

export const BLOCK_MOTION: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 240, damping: 26 } }
};

export const TAB_PANEL_MOTION: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: EASE_OUT } }
};

export const SPOTLIGHT_SPRING = { stiffness: 120, damping: 22, mass: 0.4 } as const;

export const PILL_MOTION = { type: 'spring', stiffness: 380, damping: 32 } as const;
