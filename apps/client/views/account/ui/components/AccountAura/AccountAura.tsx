'use client';

import { useMouse } from '@siberiacancode/reactuse';
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from 'motion/react';

import type { AuraStyle } from './AccountAura.types';

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

  const auraStyle: AuraStyle = {
    '--aura-x': useMotionTemplate`${springX}%`,
    '--aura-y': useMotionTemplate`${springY}%`
  };

  if (prefersReducedMotion) {
    return <div aria-hidden className={s.root} />;
  }

  return (
    <div aria-hidden className={s.root}>
      <motion.span className={s.spotlight} style={auraStyle} />
    </div>
  );
};
