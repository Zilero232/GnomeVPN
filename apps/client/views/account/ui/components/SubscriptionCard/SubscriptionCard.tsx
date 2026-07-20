'use client';

import { useLocale, useTranslations } from 'next-intl';
import { match } from 'ts-pattern';

import { AutoRenewControl, PlanPicker } from '@/features/billing/checkout';
import { Text } from '@/shared/ui';

import type { SubscriptionCardProps } from './SubscriptionCard.types';

export const SubscriptionCard = ({ subscription, isLoading }: SubscriptionCardProps) => {
  const t = useTranslations('account');
  const locale = useLocale();

  const formatDate = (iso: string): string => {
    return new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const isActive = subscription?.status === 'active';

  return match({ isLoading, isActive })
    .with({ isLoading: true }, () => <Text tone="muted">{t('loading')}</Text>)
    .with({ isActive: true }, () => (
      <>
        <Text tone="success">{t('active')}</Text>

        {subscription && (
          <Text size="xs" tone="muted">
            {t(`plans.${subscription.plan}`)}
          </Text>
        )}

        {subscription?.currentPeriodEnd && (
          <Text size="xs" tone="muted">
            {t('activeUntil', { date: formatDate(subscription.currentPeriodEnd) })}
          </Text>
        )}

        {subscription && <AutoRenewControl subscription={subscription} />}
      </>
    ))
    .otherwise(() => (
      <>
        <Text>{t('inactive')}</Text>
        <Text size="xs" tone="muted">
          {t('pitch')}
        </Text>
        <PlanPicker />
      </>
    ));
};
