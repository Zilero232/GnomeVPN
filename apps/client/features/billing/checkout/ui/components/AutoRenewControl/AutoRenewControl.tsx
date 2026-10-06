'use client';

import { CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { match } from 'ts-pattern';

import { Button, ConfirmDialog, SubmitButton, Text } from '@/ui-kit';

import type { AutoRenewControlProps } from './AutoRenewControl.types';

import { useBindCard, useCancelAutoRenew, useResumeAutoRenew, useUnbindCard } from '../../../model/hooks';

import s from './AutoRenewControl.module.scss';

export const AutoRenewControl = ({ subscription }: AutoRenewControlProps) => {
  const t = useTranslations('account');
  const bind = useBindCard();
  const unbind = useUnbindCard();
  const cancel = useCancelAutoRenew();
  const resume = useResumeAutoRenew();

  const [isUnbindOpen, setIsUnbindOpen] = useState(false);

  const { isRecurringAvailable, hasPaymentMethod, cancelAtPeriodEnd, savedCardTitle } = subscription;

  const onUnbind = () => {
    unbind.mutate(undefined, { onSettled: () => setIsUnbindOpen(false) });
  };

  const card = (
    <div className={s.card}>
      <span aria-hidden className={s.cardIcon}>
        <CreditCard size={15} />
      </span>

      <div className={s.cardText}>
        <Text as='span' className={s.cardTitle}>
          {savedCardTitle ?? t('cardBound')}
        </Text>

        <Text as='span' className={s.cardNote}>
          {cancelAtPeriodEnd ? t('autoRenewOff') : t('autoRenewOn')}
        </Text>
      </div>

      <Button aria-haspopup='dialog' className={s.unbind} disabled={unbind.isPending} variant='ghost' onClick={() => setIsUnbindOpen(true)}>
        {t('unbindCard')}
      </Button>

      <ConfirmDialog
        cancelLabel={t('unbindConfirmCancel')}
        confirmLabel={t('unbindConfirmAction')}
        description={t('unbindConfirmBody')}
        isOpen={isUnbindOpen}
        isPending={unbind.isPending}
        title={t('unbindConfirmTitle')}
        onConfirm={onUnbind}
        onOpenChange={setIsUnbindOpen}
      />
    </div>
  );

  return match({ isRecurringAvailable, hasPaymentMethod, cancelAtPeriodEnd })
    .with({ isRecurringAvailable: false }, () => null)
    .with({ hasPaymentMethod: false }, () => (
      <div className={s.prompt}>
        <Text size='xs' tone='muted'>
          {t('noPaymentMethod')}
        </Text>

        <SubmitButton isPending={bind.isPending} size='md' type='button' variant='ghost' onClick={() => bind.mutate()}>
          {t('bindCard')}
        </SubmitButton>
      </div>
    ))
    .with({ cancelAtPeriodEnd: true }, () => (
      <div className={s.root}>
        {card}

        <SubmitButton isPending={resume.isPending} size='md' type='button' variant='ghost' onClick={() => resume.mutate()}>
          {t('resumeAutoRenew')}
        </SubmitButton>
      </div>
    ))
    .otherwise(() => (
      <div className={s.root}>
        {card}

        <SubmitButton isPending={cancel.isPending} size='md' type='button' variant='ghost' onClick={() => cancel.mutate()}>
          {t('cancelAutoRenew')}
        </SubmitButton>
      </div>
    ));
};
