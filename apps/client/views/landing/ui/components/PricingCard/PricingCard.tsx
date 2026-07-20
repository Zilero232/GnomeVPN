'use client';

import { PLANS, planDiscountPercent } from '@gnomevpn/schemas';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/shared/constants';
import { Badge, Button, Stack, Text } from '@/shared/ui';
import { FEATURED_PLAN_ID, PRICING_FEATURES } from '../../../config';

import s from './PricingCard.module.scss';

export const PricingCard = () => {
  const t = useTranslations('landing.pricing');

  return (
    <Stack className={s.root} gap="lg">
      <div className={s.plans}>
        {PLANS.map((plan) => {
          const discount = planDiscountPercent(plan.id);

          return (
            <Stack
              className={clsx(s.plan, plan.id === FEATURED_PLAN_ID && s.featured)}
              gap="md"
              key={plan.id}
            >
              <div className={s.head}>
                <span className={s.term}>{t(`plans.${plan.id}`)}</span>
                {discount > 0 && <Badge>{t('save', { percent: discount })}</Badge>}
              </div>

              <div className={s.price}>
                <span className={s.amount}>{t('amount', { price: plan.priceRub })}</span>
                {plan.months === 1 && <span className={s.period}>{t('period')}</span>}
              </div>

              <Text size="xs" tone="muted">
                {t('perMonth', { price: Math.round(plan.priceRub / plan.months) })}
              </Text>
            </Stack>
          );
        })}
      </div>

      <Stack className={s.footer} gap="md">
        <ul className={s.list}>
          {PRICING_FEATURES.map((feature) => (
            <li className={s.item} key={feature}>
              <Check aria-hidden className={s.check} />
              {t(feature)}
            </li>
          ))}
        </ul>

        <Link href={ROUTES.account}>
          <Button size="lg">{t('cta')}</Button>
        </Link>
      </Stack>
    </Stack>
  );
};
