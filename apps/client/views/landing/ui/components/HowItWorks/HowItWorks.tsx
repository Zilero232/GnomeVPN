'use client';

import { LOWEST_MONTHLY_RUB } from '@gnomevpn/schemas';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';

import { HOW_IT_WORKS_STEPS } from '../../../config';
import { REVEAL_VIEWPORT, SECTION_MOTION, STEP_MOTION } from '../../LandingPage.motion';

import s from './HowItWorks.module.scss';

export const HowItWorks = () => {
  const t = useTranslations('landing.how');

  return (
    <motion.div
      className={s.grid}
      initial='hidden'
      variants={SECTION_MOTION}
      viewport={REVEAL_VIEWPORT}
      whileInView='visible'
    >
      {HOW_IT_WORKS_STEPS.map((step, index) => (
        <motion.article key={step} className={s.step} variants={STEP_MOTION}>
          <Text as='span' className={s.index}>
            0{index + 1}
          </Text>
          <Text as='h3' className={s.title}>
            {t(`${step}Title`)}
          </Text>
          <Text as='p' className={s.body}>
            {t(`${step}Body`, { price: LOWEST_MONTHLY_RUB })}
          </Text>
        </motion.article>
      ))}
    </motion.div>
  );
};
