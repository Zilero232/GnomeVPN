import { planDiscountPercent, planMonthlyRub, PLANS } from '@gnomevpn/schemas';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ROUTES } from '@/shared/constants';
import { Link } from '@/shared/i18n/navigation';
import { Badge, buttonVariants, Stack, Text } from '@/ui-kit';

import { FEATURED_PLAN_ID, PRICING_FEATURES } from '../config';

import s from './PricingCard.module.scss';

export const PricingCard = () => {
  const t = useTranslations('plans');

  return (
    <Stack className={s.root} gap='lg'>
      <ul className={s.plans}>
        {PLANS.map((plan) => {
          const discount = planDiscountPercent(plan.id);

          return (
            <Stack key={plan.id} as='li' className={clsx(s.plan, plan.id === FEATURED_PLAN_ID && s.featured)} gap='md'>
              <div className={s.head}>
                <Text as='span' className={s.term}>
                  {t(`plans.${plan.id}`)}
                </Text>
                {discount > 0 && <Badge>{t('save', { percent: discount })}</Badge>}
              </div>

              <div className={s.price}>
                <Text as='span' className={s.amount}>
                  {t('amount', { price: plan.priceRub })}
                </Text>
                {plan.months === 1 && (
                  <Text as='span' className={s.period}>
                    {t('period')}
                  </Text>
                )}
              </div>

              <Text size='xs' tone='muted'>
                {t('perMonth', { price: planMonthlyRub(plan.id) })}
              </Text>
            </Stack>
          );
        })}
      </ul>

      <Stack className={s.footer} gap='md'>
        <ul className={s.list}>
          {PRICING_FEATURES.map((feature) => (
            <li key={feature} className={s.item}>
              <Check aria-hidden className={s.check} />
              {t(feature)}
            </li>
          ))}
        </ul>

        <Link className={buttonVariants({ size: 'lg', class: s.cta })} href={ROUTES.account}>
          {t('cta')}
        </Link>
      </Stack>
    </Stack>
  );
};
