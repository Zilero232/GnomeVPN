'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';

import { PLATFORMS } from '../../../config';
import { ITEM_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '../../LandingPage.motion';

import s from './Platforms.module.scss';

export const Platforms = () => {
  const t = useTranslations('landing.platforms');

  return (
    <motion.div className={s.grid} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
      {PLATFORMS.map((platform) => (
        <motion.article
          key={platform.key}
          className={s.card}
          data-native={platform.isNative}
          variants={ITEM_MOTION}
          whileHover={{ y: -5, transition: { type: 'spring', stiffness: 400, damping: 24 } }}
        >
          <Text as='span' className={s.badge}>
            {t(platform.isNative ? 'native' : 'config')}
          </Text>
          <Text as='h3' className={s.name}>
            {platform.name}
          </Text>
          <Text as='p' className={s.body}>
            {t(`${platform.key}Body`)}
          </Text>
        </motion.article>
      ))}
    </motion.div>
  );
};
