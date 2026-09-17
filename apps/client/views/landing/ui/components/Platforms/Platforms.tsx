'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { usePlatforms } from '@/entities/app/incy';
import { Text } from '@/ui-kit';

import { ITEM_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '../../LandingPage.motion';

import s from './Platforms.module.scss';

export const Platforms = () => {
  const t = useTranslations('landing.platforms');
  const tIncy = useTranslations('incy.platforms');
  const platforms = usePlatforms();

  return (
    <motion.div className={s.grid} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
      {platforms.map(({ id, icon: Icon }) => (
        <motion.article
          key={id}
          className={s.card}
          variants={ITEM_MOTION}
          whileHover={{ y: -5, transition: { type: 'spring', stiffness: 400, damping: 24 } }}
        >
          <Icon aria-hidden className={s.icon} size={20} />

          <Text as='h3' className={s.name}>
            {tIncy(id)}
          </Text>

          <Text as='p' className={s.body}>
            {t(`${id}Body`)}
          </Text>
        </motion.article>
      ))}
    </motion.div>
  );
};
