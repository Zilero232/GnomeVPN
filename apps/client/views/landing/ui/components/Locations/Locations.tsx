'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { CountryFlag, Text } from '@/shared/ui';

import { LOCATIONS } from '../../../config';
import { CARD_HOVER, ITEM_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '../../LandingPage.motion';

import s from './Locations.module.scss';

export const Locations = () => {
  const t = useTranslations('landing.locations');

  return (
    <motion.div
      className={s.grid}
      initial='hidden'
      variants={SECTION_MOTION}
      viewport={REVEAL_VIEWPORT}
      whileInView='visible'
    >
      {LOCATIONS.map((location) => (
        <motion.article key={location.code} className={s.card} variants={ITEM_MOTION}>
          <motion.div className={s.inner} initial='rest' variants={CARD_HOVER} whileHover='hover'>
            <CountryFlag className={s.flag} countryCode={location.code} size='lg' />

            <div className={s.body}>
              <Text as='h3' className={s.name}>
                {t(`${location.key}Name`)}
              </Text>
              <Text as='p' className={s.city}>
                {t(`${location.key}City`)}
              </Text>
            </div>

            <span className={s.pulse} />
          </motion.div>
        </motion.article>
      ))}
    </motion.div>
  );
};
