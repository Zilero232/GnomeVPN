import type { MotionStyle, MotionValue } from 'motion/react';

export type AuraStyle = MotionStyle & {
  '--aura-x': MotionValue<string>;
  '--aura-y': MotionValue<string>;
};
