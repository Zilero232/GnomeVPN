'use client';

import { Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/shared/constants';
import { Button } from '@/shared/ui';

import s from './PricingCard.module.scss';

const FEATURES = ['feature1', 'feature2', 'feature3', 'feature4'] as const;

export const PricingCard = () => {
  const t = useTranslations('landing.pricing');

  return (
    <div className={s.root}>
      <div className={s.price}>
        <span className={s.amount}>100 ₽</span>
        <span className={s.period}>{t('period')}</span>
      </div>

      <ul className={s.list}>
        {FEATURES.map((feature) => (
          <li className={s.item} key={feature}>
            <Check aria-hidden className={s.check} />
            {t(feature)}
          </li>
        ))}
      </ul>

      <Link href={ROUTES.account}>
        <Button size="lg">{t('cta')}</Button>
      </Link>
    </div>
  );
};
