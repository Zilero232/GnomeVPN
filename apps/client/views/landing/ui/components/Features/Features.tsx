'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';

import { FEATURE_CARDS } from '../../../config';
import { ICON_HOVER, ITEM_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '../../LandingPage.motion';
import { FEATURE_ICONS } from './Features.config';

import s from './Features.module.scss';

export const Features = () => {
  const t = useTranslations('landing.features');

  return (
    <motion.div className={s.grid} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
      {FEATURE_CARDS.map((card) => {
        const Icon = FEATURE_ICONS[card];

        return (
          <motion.article key={card} className={s.card} initial='rest' variants={ITEM_MOTION} whileHover='hover'>
            <motion.span className={s.icon} variants={ICON_HOVER}>
              <Icon size={17} strokeWidth={1.8} />
            </motion.span>

            <Text as='h3' className={s.title}>
              {t(`${card}Title`)}
            </Text>
            <Text as='p' className={s.body}>
              {t(`${card}Body`)}
            </Text>
          </motion.article>
        );
      })}
    </motion.div>
  );
};
