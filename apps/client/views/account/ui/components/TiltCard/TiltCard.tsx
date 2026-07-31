'use client';

import type { MotionStyle } from 'motion/react';

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';

import type { TiltCardProps } from './TiltCard.types';

import { TILT_MAX_DEG, TILT_SPRING } from './TiltCard.constants';

import s from './TiltCard.module.scss';

export const TiltCard = ({ children, className }: TiltCardProps) => {
  const prefersReducedMotion = useReducedMotion();

  const pointerX = useMotionValue(0.5);
  const pointerY = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(pointerY, [0, 1], [TILT_MAX_DEG, -TILT_MAX_DEG]), TILT_SPRING);
  const rotateY = useSpring(useTransform(pointerX, [0, 1], [-TILT_MAX_DEG, TILT_MAX_DEG]), TILT_SPRING);

  const glareX = useMotionTemplate`${useTransform(pointerX, (value) => value * 100)}%`;
  const glareY = useMotionTemplate`${useTransform(pointerY, (value) => value * 100)}%`;

  const handleMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();

    pointerX.set((event.clientX - bounds.left) / bounds.width);
    pointerY.set((event.clientY - bounds.top) / bounds.height);
  };

  const handleLeave = () => {
    pointerX.set(0.5);
    pointerY.set(0.5);
  };

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={[s.root, className].filter(Boolean).join(' ')}
      style={{ rotateX, rotateY }}
      onPointerLeave={handleLeave}
      onPointerMove={handleMove}
    >
      <motion.span aria-hidden className={s.glare} style={{ '--glare-x': glareX, '--glare-y': glareY } as MotionStyle} />
      {children}
    </motion.div>
  );
};
