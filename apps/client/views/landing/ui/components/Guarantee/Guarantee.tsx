'use client';

import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { ROUTES } from '@/shared/constants';
import { Button, Text } from '@/shared/ui';

import { ITEM_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '../../LandingPage.motion';

import s from './Guarantee.module.scss';

export const Guarantee = () => {
  const t = useTranslations('landing.guarantee');

  return (
    <motion.div className={s.root} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
      <motion.span className={s.icon} variants={ITEM_MOTION}>
        <ShieldCheck size={22} strokeWidth={1.7} />
      </motion.span>

      <motion.div className={s.body} variants={ITEM_MOTION}>
        <Text as='h3' className={s.title}>
          {t('title')}
        </Text>
        <Text as='p' className={s.text}>
          {t('body')}
        </Text>
      </motion.div>

      <motion.div variants={ITEM_MOTION}>
        <Link href={ROUTES.account}>
          <Button size='md'>{t('cta')}</Button>
        </Link>
      </motion.div>
    </motion.div>
  );
};
