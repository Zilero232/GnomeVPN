'use client';

import { useTranslations } from 'next-intl';

import { Text } from '@/shared/ui';
import {
  Faq,
  Features,
  Hero,
  HowItWorks,
  LandingFooter,
  LandingHeader,
  Platforms,
  PricingCard,
} from './components';

import s from './LandingPage.module.scss';

export const LandingPage = () => {
  const t = useTranslations('landing');

  return (
    <main className={s.root}>
      <LandingHeader />

      <Hero />

      <section className={s.section} id="how">
        <Text as="h2" className={s.sectionTitle}>
          {t('how.title')}
        </Text>
        <HowItWorks />
      </section>

      <section className={s.section} id="features">
        <Text as="h2" className={s.sectionTitle}>
          {t('features.title')}
        </Text>
        <Features />
      </section>

      <section className={s.section} id="platforms">
        <Text as="h2" className={s.sectionTitle}>
          {t('platforms.title')}
        </Text>
        <Platforms />
      </section>

      <section className={s.section} id="pricing">
        <Text as="h2" className={s.sectionTitle}>
          {t('pricing.title')}
        </Text>
        <PricingCard />
      </section>

      <section className={s.section} id="faq">
        <Text as="h2" className={s.sectionTitle}>
          {t('faq.title')}
        </Text>
        <Faq />
      </section>

      <LandingFooter />
    </main>
  );
};
