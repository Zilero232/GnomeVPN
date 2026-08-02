'use client';

import type { PlanId } from '@gnomevpn/schemas';

import { DEFAULT_PLAN_ID, findPlan, planDiscountPercent, PLANS } from '@gnomevpn/schemas';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Badge, SelectableCard, Stack, Text } from '@/shared/ui';

import type { PlanPickerProps } from './PlanPicker.types';

import { CheckoutButton } from './components';

import s from './PlanPicker.module.scss';

export const PlanPicker = ({ className }: PlanPickerProps) => {
  const t = useTranslations('account.plans');
  const [selected, setSelected] = useState<PlanId>(DEFAULT_PLAN_ID);

  const plan = findPlan(selected);

  return (
    <Stack className={clsx(s.root, className)} gap='md'>
      <Stack className={s.list} gap='sm'>
        {PLANS.map((option) => {
          const discount = planDiscountPercent(option.id);

          return (
            <SelectableCard key={option.id} className={s.card} isSelected={option.id === selected} onClick={() => setSelected(option.id)}>
              <Stack className={s.body} gap='sm'>
                <span className={s.head}>
                  <Text as='span' className={s.term}>
                    {t(option.id)}
                  </Text>
                  {discount > 0 && <Badge>{t('save', { percent: discount })}</Badge>}
                </span>

                <Text size='xs' tone='muted'>
                  {t('perMonth', { price: Math.round(option.priceRub / option.months) })}
                </Text>
              </Stack>

              <Text as='span' className={s.price}>
                {t('price', { price: option.priceRub })}
              </Text>
            </SelectableCard>
          );
        })}
      </Stack>

      <CheckoutButton className={s.submit} planId={selected}>
        {t('pay', { price: plan.priceRub })}
      </CheckoutButton>
    </Stack>
  );
};
