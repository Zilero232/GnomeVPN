import type { MotionStyle, MotionValue } from 'motion/react';
import type { ReactNode } from 'react';

export type TiltCardProps = {
  children: ReactNode;
  className?: string;
};

export type GlareStyle = MotionStyle & {
  '--glare-x': MotionValue<string>;
  '--glare-y': MotionValue<string>;
};
