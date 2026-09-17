'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { usePlatforms } from '@/entities/app/incy';
import { REVEAL_VIEWPORT, ROW_MOTION, SECTION_MOTION } from '@/shared/lib';
import { Text } from '@/ui-kit';

import s from './Platforms.module.scss';

export const Platforms = () => {
  const t = useTranslations('landing.platforms');
  const tIncy = useTranslations('incy.platforms');
  const platforms = usePlatforms();

  return (
    <motion.div className={s.list} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
      {platforms.map(({ id, icon: Icon }) => (
        <motion.article key={id} className={s.row} variants={ROW_MOTION}>
          <Icon aria-hidden className={s.icon} size={18} strokeWidth={1.7} />

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
