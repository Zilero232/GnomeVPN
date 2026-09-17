'use client';

import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { HEAD_MOTION, PAGE_MOTION, REVEAL_VIEWPORT, SECTION_MOTION } from '@/shared/lib';
import { Accordion, Text } from '@/ui-kit';
import { PricingCard } from '@/widgets/billing/pricing-plans';

import { PRICING_FAQ, PRICING_INCLUDED } from '../config';

import s from './PricingPage.module.scss';

export const PricingPage = () => {
  const t = useTranslations('pricing');
  const tFaq = useTranslations('faq.questions');

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

      <PricingCard />

      <motion.section className={s.included} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        <Text as='h2' className={s.sectionTitle}>
          {t('includedTitle')}
        </Text>

        <ul className={s.list}>
          {PRICING_INCLUDED.map((item) => (
            <li key={item} className={s.item}>
              <Check aria-hidden className={s.check} size={16} />
              <span>{t(`included.${item}`)}</span>
            </li>
          ))}
        </ul>
      </motion.section>

      <motion.section className={s.faq} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        <Text as='h2' className={s.sectionTitle}>
          {t('faqTitle')}
        </Text>

        <Accordion
          items={PRICING_FAQ.map((question) => ({
            value: question,
            title: tFaq(`${question}.q`),
            content: tFaq(`${question}.a`)
          }))}
        />
      </motion.section>
    </motion.main>
  );
};
