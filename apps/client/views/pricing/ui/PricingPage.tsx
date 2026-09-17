'use client';

import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { Accordion, Button, Text } from '@/ui-kit';
import { PricingCard } from '@/widgets/billing/pricing-plans';

import { PRICING_FAQ, PRICING_INCLUDED } from '../config';

import s from './PricingPage.module.scss';

export const PricingPage = () => {
  const t = useTranslations('pricing');
  const tFaq = useTranslations('faq.questions');

  return (
    <main className={s.root}>
      <header className={s.head}>
        <Text as='h1' className={s.title}>
          {t('title')}
        </Text>

        <Text as='p' className={s.intro} tone='muted'>
          {t('intro')}
        </Text>
      </header>

      <PricingCard />

      <section className={s.included}>
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
      </section>

      <section className={s.faq}>
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
      </section>

      <footer className={s.cta}>
        <Text as='p' className={s.ctaText}>
          {t('ctaText')}
        </Text>

        <Link href={ROUTES.account}>
          <Button>{t('ctaAction')}</Button>
        </Link>
      </footer>
    </main>
  );
};
