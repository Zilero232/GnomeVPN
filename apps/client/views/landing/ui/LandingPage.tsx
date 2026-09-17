'use client';

import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';

import { Text } from '@/ui-kit';
import { PricingCard } from '@/widgets/billing/pricing-plans';

import { Comparison, Faq, Features, Guarantee, Hero, HowItWorks, Locations, Platforms } from './components';
import { REVEAL_VIEWPORT, TITLE_MOTION } from './LandingPage.motion';

import s from './LandingPage.module.scss';

const SectionTitle = ({ children }: { children: string }) => (
  <motion.div initial='hidden' variants={TITLE_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
    <Text as='h2' className={s.sectionTitle}>
      {children}
    </Text>
  </motion.div>
);

export const LandingPage = () => {
  const t = useTranslations('landing');
  const tPlans = useTranslations('plans');

  return (
    <main className={s.root}>
      <Hero />

      <section className={s.section} id='how'>
        <SectionTitle>{t('how.title')}</SectionTitle>
        <HowItWorks />
      </section>

      <section className={s.section} id='features'>
        <SectionTitle>{t('features.title')}</SectionTitle>
        <Features />
      </section>

      <section className={s.section} id='locations'>
        <SectionTitle>{t('locations.title')}</SectionTitle>
        <Locations />
      </section>

      <section className={s.section} id='compare'>
        <SectionTitle>{t('comparison.title')}</SectionTitle>
        <Comparison />
      </section>

      <section className={s.section} id='platforms'>
        <SectionTitle>{t('platforms.title')}</SectionTitle>
        <Platforms />
      </section>

      <section className={s.section} id='pricing'>
        <SectionTitle>{tPlans('title')}</SectionTitle>
        <PricingCard />
      </section>

      <section className={s.section}>
        <Guarantee />
      </section>

      <section className={s.section} id='faq'>
        <SectionTitle>{t('faq.title')}</SectionTitle>
        <Faq />
      </section>
    </main>
  );
};
