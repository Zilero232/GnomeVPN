'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LocaleSwitcher } from '@/features/app/switch-locale';
import { ROUTES } from '@/shared/constants';
import { BrandMark } from '@/shared/ui';
import { Faq, Hero, HowItWorks, PricingCard } from './components';

import s from './LandingPage.module.scss';

export const LandingPage = () => {
  const t = useTranslations('landing');

  return (
    <main className={s.root}>
      <nav className={s.nav}>
        <BrandMark size="lg" />

        <div className={s.navRight}>
          <LocaleSwitcher />
          <Link className={s.navLink} href={ROUTES.account}>
            {t('account')}
          </Link>
        </div>
      </nav>

      <Hero />

      <section className={s.section} id="how">
        <h2 className={s.sectionTitle}>{t('how.title')}</h2>
        <HowItWorks />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>{t('pricing.title')}</h2>
        <PricingCard />
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>{t('faq.title')}</h2>
        <Faq />
      </section>
    </main>
  );
};
