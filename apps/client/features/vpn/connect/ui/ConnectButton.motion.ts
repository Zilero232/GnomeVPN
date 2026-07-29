import type { Variants } from 'motion/react';

export const RING_MOTION: Variants = {
  disconnected: { opacity: 0.45 },
  connecting: {
    opacity: [0.3, 0.85, 0.3],
    transition: { duration: 1.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }
  },
  connected: { opacity: 0.9, transition: { duration: 0.4 } }
};

export const HALO_MOTION: Variants = {
  initial: { scale: 0.94, opacity: 0 },
  animate: { scale: [0.94, 1.18], opacity: [0, 0.32, 0] }
};

export const haloTransition = (delay: number) => ({
  duration: 2.8,
  repeat: Number.POSITIVE_INFINITY,
  ease: 'easeOut' as const,
  delay,
  opacity: { times: [0, 0.25, 1], duration: 2.8 }
});
