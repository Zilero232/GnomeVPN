'use client';

import { useTranslations } from 'next-intl';
import { match, P } from 'ts-pattern';

import { AutoRenewControl, PlanPicker } from '@/features/billing/checkout';
import { TrialBanner } from '@/features/billing/claim-trial';
import { ErrorBlock, LoadingBlock, Text } from '@/ui-kit';

import type { SubscriptionCardProps } from './SubscriptionCard.types';

import { SubscriptionHero } from './components';

import s from './SubscriptionCard.module.scss';

export const SubscriptionCard = ({ subscription, isLoading, isError, onRetry }: SubscriptionCardProps) => {
  const t = useTranslations('account');

  const isUnavailable = isError && !subscription;

  return match({ isLoading, isUnavailable, subscription })
    .with({ isLoading: true }, () => <LoadingBlock label={t('loading')} />)
    .with({ isUnavailable: true }, () => <ErrorBlock message={t('unavailable')} retryLabel={t('retry')} onRetry={onRetry} />)
    .with({ subscription: P.select({ period: 'paid' }) }, (paid) => (
      <>
        <SubscriptionHero subscription={paid} />

        <AutoRenewControl subscription={paid} />
      </>
    ))
    .with({ subscription: P.select({ period: 'trial' }) }, (trial) => (
      <>
        <SubscriptionHero subscription={trial} />

        <div className={s.upgrade}>
          <Text size='xs' tone='muted'>
            {t('trialUpgrade')}
          </Text>

          <PlanPicker />
        </div>
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

        {subscription?.isTrialAvailable && <TrialBanner />}

        <div className={s.picker}>
          <PlanPicker />
        </div>
      </>
    ));
};
