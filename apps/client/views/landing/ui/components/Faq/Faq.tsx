'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';

import { FAQ_ITEMS } from '../../../config';
import { REVEAL_VIEWPORT, ROW_MOTION, SECTION_MOTION } from '../../LandingPage.motion';

import s from './Faq.module.scss';

export const Faq = () => {
  const t = useTranslations('landing.faq');

  return (
    <motion.div className={s.list} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
      {FAQ_ITEMS.map((item) => (
        <motion.article key={item} className={s.item} variants={ROW_MOTION}>
          <Text as='h3' className={s.question}>
            {t(`q${item}`)}
          </Text>
          <Text as='p' className={s.answer}>
            {t(`a${item}`)}
          </Text>
        </motion.article>
      ))}
    </motion.div>
  );
};
