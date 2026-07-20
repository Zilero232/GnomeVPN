'use client';

import { DEFAULT_PLAN_ID, findPlan, PLANS, planDiscountPercent } from '@gnomevpn/schemas';
import { clsx } from 'clsx';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Badge, SelectableCard, Stack, Text } from '@/shared/ui';
import { CheckoutButton } from './components';

import s from './PlanPicker.module.scss';

import type { PlanId } from '@gnomevpn/schemas';
import type { PlanPickerProps } from './PlanPicker.types';

export const PlanPicker = ({ className }: PlanPickerProps) => {
  const t = useTranslations('account.plans');
  const [selected, setSelected] = useState<PlanId>(DEFAULT_PLAN_ID);

  const plan = findPlan(selected);

  return (
    <Stack className={clsx(s.root, className)} gap="md">
      <Stack className={s.list} gap="sm">
        {PLANS.map((option) => {
          const discount = planDiscountPercent(option.id);

          return (
            <SelectableCard
              className={s.card}
              isSelected={option.id === selected}
              key={option.id}
              onClick={() => setSelected(option.id)}
            >
              <Stack className={s.body} gap="sm">
                <span className={s.head}>
                  <span className={s.term}>{t(option.id)}</span>
                  {discount > 0 && <Badge>{t('save', { percent: discount })}</Badge>}
                </span>

                <Text size="xs" tone="muted">
                  {t('perMonth', { price: Math.round(option.priceRub / option.months) })}
                </Text>
              </Stack>

              <span className={s.price}>{t('price', { price: option.priceRub })}</span>
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
