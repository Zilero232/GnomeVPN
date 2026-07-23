'use client';

import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { match } from 'ts-pattern';

import { Button, Text } from '@/shared/ui';
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
      <span className={s.cardIcon}>
        <CreditCard size={15} />
      </span>

      <div className={s.cardText}>
        <span className={s.cardTitle}>{savedCardTitle ?? t('cardBound')}</span>

        <span className={s.cardNote}>
          {cancelAtPeriodEnd ? t('autoRenewOff') : t('autoRenewOn')}
        </span>
      </div>

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
      <div className={s.root}>
        <Text size="xs" tone="muted">
          {t('noPaymentMethod')}
        </Text>

        <Button disabled={bind.isPending} variant="ghost" onClick={() => bind.mutate()}>
          {t('bindCard')}
        </Button>
      </div>
    ))
    .with({ cancelAtPeriodEnd: true }, () => (
      <div className={s.root}>
        {card}

        <Button disabled={resume.isPending} variant="ghost" onClick={() => resume.mutate()}>
          {t('resumeAutoRenew')}
        </Button>
      </div>
    ))
    .otherwise(() => (
      <div className={s.root}>
        {card}

        <Button disabled={cancel.isPending} variant="ghost" onClick={() => cancel.mutate()}>
          {t('cancelAutoRenew')}
        </Button>
      </div>
    ));
};
