'use client';

import { useLocale, useTranslations } from 'next-intl';
import { match } from 'ts-pattern';

import { AutoRenewControl, ExtraDevicesControl, PlanPicker } from '@/features/billing/checkout';
import { Text } from '@/shared/ui';

import s from './SubscriptionCard.module.scss';

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
        <span className={s.status}>
          <span className={s.dot} />
          {t('active')}
        </span>

        <dl className={s.meta}>
          {subscription && (
            <>
              <dt className={s.label}>{t('planLabel')}</dt>
              <dd className={s.value}>{t(`plans.${subscription.plan}`)}</dd>
            </>
          )}

          {subscription?.currentPeriodEnd && (
            <>
              <dt className={s.label}>{t('untilLabel')}</dt>
              <dd className={s.value}>{formatDate(subscription.currentPeriodEnd)}</dd>
            </>
          )}
        </dl>

        {subscription && (
          <>
            <ExtraDevicesControl limits={subscription.limits} />

            <div className={s.addon}>
              <AutoRenewControl subscription={subscription} />
            </div>
          </>
        )}
      </>
    ))
    .otherwise(() => (
      <>
        <div className={s.pitch}>
          <Text>{t('inactive')}</Text>
          <Text size="xs" tone="muted">
            {t('pitch')}
          </Text>
        </div>

        <div className={s.picker}>
          <PlanPicker />
        </div>
      </>
    ));
};
