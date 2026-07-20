'use client';

import { useTranslations } from 'next-intl';
import { match } from 'ts-pattern';

import { Button, Stack, Text } from '@/shared/ui';
import {
  useBindCard,
  useCancelAutoRenew,
  useResumeAutoRenew,
  useUnbindCard,
} from '../../../model/hooks';

import s from './AutoRenewControl.module.scss';

import type { AutoRenewControlProps } from './AutoRenewControl.types';

export const AutoRenewControl = ({ subscription }: AutoRenewControlProps) => {
  const t = useTranslations('account');
  const bind = useBindCard();
  const unbind = useUnbindCard();
  const cancel = useCancelAutoRenew();
  const resume = useResumeAutoRenew();

  const { isRecurringAvailable, hasPaymentMethod, cancelAtPeriodEnd, savedCardTitle } =
    subscription;

  const card = (
    <div className={s.card}>
      <Text size="xs" tone="muted">
        {savedCardTitle ?? t('cardBound')}
      </Text>

      <Button
        className={s.unbind}
        disabled={unbind.isPending}
        variant="ghost"
        onClick={() => unbind.mutate()}
      >
        {t('unbindCard')}
      </Button>
    </div>
  );

  return match({ isRecurringAvailable, hasPaymentMethod, cancelAtPeriodEnd })
    .with({ isRecurringAvailable: false }, () => null)
    .with({ hasPaymentMethod: false }, () => (
      <>
        <Text size="xs" tone="muted">
          {t('noPaymentMethod')}
        </Text>

        <Button disabled={bind.isPending} variant="ghost" onClick={() => bind.mutate()}>
          {t('bindCard')}
        </Button>
      </>
    ))
    .with({ cancelAtPeriodEnd: true }, () => (
      <Stack gap="sm">
        {card}

        <Text size="xs" tone="muted">
          {t('autoRenewOff')}
        </Text>

        <Button disabled={resume.isPending} variant="ghost" onClick={() => resume.mutate()}>
          {t('resumeAutoRenew')}
        </Button>
      </Stack>
    ))
    .otherwise(() => (
      <Stack gap="sm">
        {card}

        <Button disabled={cancel.isPending} variant="ghost" onClick={() => cancel.mutate()}>
          {t('cancelAutoRenew')}
        </Button>
      </Stack>
    ));
};
