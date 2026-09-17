'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { FAQ_GROUPS } from '@/entities/app/faq';
import { SITE } from '@/shared/config';
import { HEAD_MOTION, PAGE_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '@/shared/lib';
import { faqJsonLd, JsonLd } from '@/shared/seo';
import { Accordion, Text } from '@/ui-kit';

import s from './FaqPage.module.scss';

export const FaqPage = () => {
  const t = useTranslations('faq');

  const entries = FAQ_GROUPS.flatMap(({ questions }) =>
    questions.map((question) => ({ question: t(`questions.${question}.q`), answer: t(`questions.${question}.a`) }))
  );

  return (
    <motion.main animate='visible' className={s.root} initial='hidden' variants={PAGE_MOTION}>
      <JsonLd data={faqJsonLd({ entries })} />

      <motion.header className={s.head} variants={HEAD_MOTION}>
        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text as='p' className={s.intro} tone='muted'>
          {t('intro')}
        </Text>
      </motion.header>

      {FAQ_GROUPS.map(({ key, questions }) => (
        <motion.section key={key} className={s.group} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
          <Text as='h2' className={s.groupTitle}>
            {t(`groups.${key}`)}
          </Text>

          <Accordion
            items={questions.map((question) => ({
              value: question,
              title: t(`questions.${question}.q`),
              content: t(`questions.${question}.a`)
            }))}
          />
        </motion.section>
      ))}

      <motion.footer className={s.footer} variants={HEAD_MOTION}>
        <Text as='p' size='sm' tone='muted'>
          {t('stillStuck')}
        </Text>

        <a className={s.link} href={`mailto:${SITE.email}`}>
          {SITE.email}
        </a>
      </motion.footer>
    </motion.main>
  );
};
