'use client';

import { useTranslations } from 'next-intl';

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
        <h2 className={s.sectionTitle}>{t('how.title')}</h2>
        <HowItWorks />
      </section>

      <section className={s.section} id="features">
        <h2 className={s.sectionTitle}>{t('features.title')}</h2>
        <Features />
      </section>

      <section className={s.section} id="platforms">
        <h2 className={s.sectionTitle}>{t('platforms.title')}</h2>
        <Platforms />
      </section>

      <section className={s.section} id="pricing">
        <h2 className={s.sectionTitle}>{t('pricing.title')}</h2>
        <PricingCard />
      </section>

      <section className={s.section} id="faq">
        <h2 className={s.sectionTitle}>{t('faq.title')}</h2>
        <Faq />
      </section>

      <LandingFooter />
    </main>
  );
};
