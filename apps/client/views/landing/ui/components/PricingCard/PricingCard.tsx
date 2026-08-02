'use client';

import { planDiscountPercent, PLANS } from '@gnomevpn/schemas';
import { clsx } from 'clsx';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

import { ROUTES } from '@/shared/constants';
import { Badge, Button, Stack, Text } from '@/shared/ui';

import { FEATURED_PLAN_ID, PRICING_FEATURES } from '../../../config';
import { REVEAL_VIEWPORT, SECTION_MOTION } from '../../LandingPage.motion';

import s from './PricingCard.module.scss';

export const PricingCard = () => {
  const t = useTranslations('landing.pricing');

  return (
    <Stack className={s.root} gap='lg'>
      <motion.div className={s.plans} initial='hidden' variants={SECTION_MOTION} viewport={REVEAL_VIEWPORT} whileInView='visible'>
        {PLANS.map((plan) => {
          const discount = planDiscountPercent(plan.id);

          return (
            <Stack key={plan.id} className={clsx(s.plan, plan.id === FEATURED_PLAN_ID && s.featured)} gap='md'>
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
                {t('perMonth', { price: Math.round(plan.priceRub / plan.months) })}
              </Text>
            </Stack>
          );
        })}
      </motion.div>

      <Stack className={s.footer} gap='md'>
        <ul className={s.list}>
          {PRICING_FEATURES.map((feature) => (
            <li key={feature} className={s.item}>
              <Check aria-hidden className={s.check} />
              {t(feature)}
            </li>
          ))}
        </ul>

        <Link href={ROUTES.account}>
          <Button size='lg'>{t('cta')}</Button>
        </Link>
      </Stack>
    </Stack>
  );
};
