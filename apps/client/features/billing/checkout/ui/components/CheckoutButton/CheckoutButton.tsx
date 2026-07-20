'use client';

import { DEFAULT_PLAN_ID, findPlan } from '@gnomevpn/schemas';
import { useTranslations } from 'next-intl';

import { SubmitButton } from '@/shared/ui';
import { useCheckout } from '../../../model/hooks';

import type { CheckoutButtonProps } from './CheckoutButton.types';

export const CheckoutButton = ({
  planId = DEFAULT_PLAN_ID,
  className,
  children,
}: CheckoutButtonProps) => {
  const t = useTranslations('account.plans');
  const { isPending, mutate } = useCheckout();

  const onClick = () => mutate(planId);

  return (
    <SubmitButton className={className} isPending={isPending} type="button" onClick={onClick}>
      {children ?? t('pay', { price: findPlan(planId).priceRub })}
    </SubmitButton>
  );
};
