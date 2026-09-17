'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { ABOUT_FACTS, ABOUT_SECTIONS } from '@/entities/app/about';
import { HEAD_MOTION, PAGE_MOTION, REVEAL_VIEWPORT, ROW_MOTION, SECTION_MOTION } from '@/shared/lib';
import { Text } from '@/ui-kit';

import s from './AboutPage.module.scss';

export const AboutPage = () => {
  const t = useTranslations('about');

  return (
    <motion.main animate='visible' className={s.root} initial='hidden' variants={PAGE_MOTION}>
      <motion.header className={s.head} variants={HEAD_MOTION}>
        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text as='p' className={s.intro} tone='muted'>
          {t('intro')}
        </Text>
      </motion.header>

      <motion.dl className={s.facts} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        {ABOUT_FACTS.map((fact) => (
          <motion.div key={fact} className={s.fact} variants={ROW_MOTION}>
            <dt className={s.factLabel}>{t(`facts.${fact}.label`)}</dt>
            <dd className={s.factValue}>{t(`facts.${fact}.value`)}</dd>
          </motion.div>
        ))}
      </motion.dl>

      {ABOUT_SECTIONS.map((section) => (
        <motion.section
          key={section}
          className={s.section}
          initial='hidden'
          variants={SECTION_MOTION}
          viewport={REVEAL_VIEWPORT}
          whileInView='visible'
        >
          <Text as='h2' className={s.heading}>
            {t(`sections.${section}.title`)}
          </Text>

          <Text as='p' className={s.body}>
            {t(`sections.${section}.body`)}
          </Text>
        </motion.section>
      ))}
    </motion.main>
  );
};
