'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { REVEAL_VIEWPORT, SECTION_MOTION } from '@/shared/lib';
import { Text } from '@/ui-kit';

import { FEATURE_CARDS } from '../../../config';
import { ITEM_MOTION } from '../../LandingPage.motion';

import s from './Features.module.scss';

export const Features = () => {
  const t = useTranslations('landing.features');

  return (
    <motion.div className={s.grid} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
      {FEATURE_CARDS.map((card, index) => (
        <motion.article key={card} className={s.card} variants={ITEM_MOTION}>
          <span aria-hidden className={s.index}>
            {String(index + 1).padStart(2, '0')}
          </span>

          <Text as='h3' className={s.title}>
            {t(`${card}Title`)}
          </Text>
          <Text as='p' className={s.body}>
            {t(`${card}Body`)}
          </Text>
        </motion.article>
      ))}
    </motion.div>
  );
};
