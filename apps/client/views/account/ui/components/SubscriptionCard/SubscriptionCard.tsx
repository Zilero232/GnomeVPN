'use client';

import { differenceInCalendarDays } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { clamp, isNonNullish } from 'remeda';
import { match } from 'ts-pattern';

import { AutoRenewControl, ExtraDevicesControl, PlanPicker } from '@/features/billing/checkout';
import { IncyCard } from '@/features/vpn/connect-incy';
import { DATE_FORMAT } from '@/shared/i18n';
import { Text } from '@/ui-kit';

import type { SubscriptionCardProps } from './SubscriptionCard.types';

import s from './SubscriptionCard.module.scss';

export const SubscriptionCard = ({ subscription, isLoading }: SubscriptionCardProps) => {
  const t = useTranslations('account');
  const format = useFormatter();

  const isActive = subscription?.status === 'active';
  const periodEnd = subscription?.currentPeriodEnd;
  const daysLeft = periodEnd ? clamp(differenceInCalendarDays(new Date(periodEnd), new Date()), { min: 0 }) : null;

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

            {isNonNullish(daysLeft) && (
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
                <dd className={s.value}>{format.dateTime(new Date(periodEnd), DATE_FORMAT)}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className={s.connect}>
          <IncyCard />
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
