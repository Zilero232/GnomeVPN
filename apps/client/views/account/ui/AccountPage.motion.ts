import type { Variants } from 'motion/react';

import { EASE_OUT } from '@/shared/lib';

export const PAGE_MOTION: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT, staggerChildren: 0.07 } }
};

export const HEADER_MOTION: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } }
};

export const BLOCK_MOTION: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', duration: 0.45, bounce: 0 } }
};

export const TAB_PANEL_MOTION: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } }
};

export const SPOTLIGHT_SPRING = { stiffness: 120, damping: 22, mass: 0.4 } as const;

export const PILL_MOTION = { type: 'spring', stiffness: 380, damping: 32 } as const;
