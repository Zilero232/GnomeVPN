'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { FAQ_HIGHLIGHTS } from '@/entities/app/faq';
import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { REVEAL_VIEWPORT, ROW_MOTION, SECTION_MOTION } from '@/shared/lib';
import { Text } from '@/ui-kit';

import s from './Faq.module.scss';

export const Faq = () => {
  const t = useTranslations('faq');
  const tLanding = useTranslations('landing.faq');

  return (
    <motion.div className={s.list} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
      {FAQ_HIGHLIGHTS.map((question) => (
        <motion.article key={question} className={s.item} variants={ROW_MOTION}>
          <Text as='h3' className={s.question}>
            {t(`questions.${question}.q`)}
          </Text>

          <Text as='p' className={s.answer}>
            {t(`questions.${question}.a`)}
          </Text>
        </motion.article>
      ))}

      <motion.div className={s.more} variants={ROW_MOTION}>
        <Link className={s.moreLink} href={ROUTES.faq}>
          {tLanding('more')}
        </Link>
      </motion.div>
    </motion.div>
  );
};
