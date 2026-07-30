'use client';

import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';

import { COMPARISON_ROWS } from '../../../config';
import { REVEAL_VIEWPORT, ROW_MOTION, SECTION_MOTION } from '../../LandingPage.motion';

import s from './Comparison.module.scss';

export const Comparison = () => {
  const t = useTranslations('landing.comparison');

  return (
    <motion.div
      className={s.wrapper}
      initial='hidden'
      variants={SECTION_MOTION}
      viewport={REVEAL_VIEWPORT}
      whileInView='visible'
    >
      <div className={s.head}>
        <span className={s.headFeature} />
        <span className={s.headUs}>GnomeVPN</span>
        <span className={s.headThem}>{t('free')}</span>
      </div>

      {COMPARISON_ROWS.map((row) => (
        <motion.div key={row} className={s.row} variants={ROW_MOTION}>
          <div className={s.feature}>
            <Text as='span' className={s.featureText}>
              {t(`${row}Label`)}
            </Text>
            <Text as='span' className={s.featureHint}>
              {t(`${row}Hint`)}
            </Text>
          </div>

          <div className={s.cell}>
            <span className={s.yes}>
              <Check size={14} strokeWidth={3} />
            </span>
          </div>

          <div className={s.cell}>
            <span className={s.no}>
              <X size={14} strokeWidth={3} />
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};
