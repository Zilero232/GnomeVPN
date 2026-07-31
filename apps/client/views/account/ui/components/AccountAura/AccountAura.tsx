'use client';

import type { MotionStyle } from 'motion/react';

import { useMouse } from '@siberiacancode/reactuse';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

import { SPOTLIGHT_SPRING } from '../../AccountPage.motion';

import s from './AccountAura.module.scss';

export const AccountAura = () => {
  const prefersReducedMotion = useReducedMotion();

  const rawX = useMotionValue(50);
  const rawY = useMotionValue(18);

  const springX = useSpring(rawX, SPOTLIGHT_SPRING);
  const springY = useSpring(rawY, SPOTLIGHT_SPRING);

  useMouse(({ clientX, clientY }) => {
    rawX.set((clientX / window.innerWidth) * 100);
    rawY.set((clientY / window.innerHeight) * 100);
  });

  const auraX = useMotionTemplate`${springX}%`;
  const auraY = useMotionTemplate`${springY}%`;

  if (prefersReducedMotion) {
    return <div aria-hidden className={s.root} />;
  }

  return (
    <div aria-hidden className={s.root}>
      <motion.span className={s.spotlight} style={{ '--aura-x': auraX, '--aura-y': auraY } as MotionStyle} />
    </div>
  );
};
