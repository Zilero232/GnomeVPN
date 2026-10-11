'use client';

import { differenceInCalendarDays } from 'date-fns';
import { CalendarClock } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { clamp, isNonNullish } from 'remeda';

import { DATE_FORMAT } from '@/shared/i18n';
import { Text } from '@/ui-kit';

import type { SubscriptionHeroProps } from './SubscriptionHero.types';

import s from './SubscriptionHero.module.scss';

export const SubscriptionHero = ({ subscription }: SubscriptionHeroProps) => {
  const t = useTranslations('account');
  const format = useFormatter();

  const periodEnd = subscription.currentPeriodEnd;
  const daysLeft = periodEnd ? clamp(differenceInCalendarDays(new Date(periodEnd), new Date()), { min: 0 }) : null;
  const planName = subscription.period === 'trial' ? t('trialPeriod') : t(`plans.${subscription.plan}`);

  return (
    <div className={s.hero}>
      <div className={s.heroMain}>
        <Text as='span' className={s.status}>
          <span aria-hidden className={s.dot} />
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
        <div className={s.metaItem}>
          <dt className={s.label}>{t('planLabel')}</dt>
          <dd className={s.value}>{planName}</dd>
        </div>

        {periodEnd && (
          <div className={s.metaItem}>
            <dt className={s.label}>
              <CalendarClock aria-hidden size={13} />
              {t('untilLabel')}
            </dt>
            <dd className={s.value}>{format.dateTime(new Date(periodEnd), DATE_FORMAT)}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};
