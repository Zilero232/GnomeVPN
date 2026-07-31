'use client';

import { differenceInCalendarDays } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { match } from 'ts-pattern';

import { AutoRenewControl, ExtraDevicesControl, PlanPicker } from '@/features/billing/checkout';
import { Text } from '@/shared/ui';

import type { SubscriptionCardProps } from './SubscriptionCard.types';

import s from './SubscriptionCard.module.scss';

export const SubscriptionCard = ({ subscription, isLoading }: SubscriptionCardProps) => {
  const t = useTranslations('account');
  const locale = useLocale();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  const isActive = subscription?.status === 'active';
  const periodEnd = subscription?.currentPeriodEnd;
  const daysLeft = periodEnd ? Math.max(0, differenceInCalendarDays(new Date(periodEnd), new Date())) : null;

  return match({ isLoading, isActive })
    .with({ isLoading: true }, () => <Text tone='muted'>{t('loading')}</Text>)
    .with({ isActive: true }, () => (
      <>
        <div className={s.hero}>
          <div className={s.heroMain}>
            <Text as='span' className={s.status}>
              <span className={s.dot} />
              {t('active')}
            </Text>

            {daysLeft !== null && (
              <p className={s.countdown}>
                <span className={s.countdownValue}>{daysLeft}</span>
                <span className={s.countdownUnit}>{t('daysLeft', { count: daysLeft })}</span>
              </p>
            )}
          </div>

          <dl className={s.meta}>
            {subscription && (
              <div className={s.metaItem}>
                <dt className={s.label}>{t('planLabel')}</dt>
                <dd className={s.value}>{t(`plans.${subscription.plan}`)}</dd>
              </div>
            )}

            {periodEnd && (
              <div className={s.metaItem}>
                <dt className={s.label}>
                  <CalendarClock size={13} />
                  {t('untilLabel')}
                </dt>
                <dd className={s.value}>{formatDate(periodEnd)}</dd>
              </div>
            )}
          </dl>
        </div>

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
          <Text size='xs' tone='muted'>
            {t('pitch')}
          </Text>
        </div>

        <div className={s.picker}>
          <PlanPicker />
        </div>
      </>
    ));
};
