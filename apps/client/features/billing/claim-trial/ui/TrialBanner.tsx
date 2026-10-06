'use client';

import { Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { useToastError } from '@/entities/app/locale';
import { SubmitButton, Text } from '@/ui-kit';

import { useClaimTrial } from '../model/hooks';

import s from './TrialBanner.module.scss';

export const TrialBanner = () => {
  const t = useTranslations('trial');
  const toastError = useToastError();
  const claim = useClaimTrial();

  const onClaim = () => {
    claim.mutate(undefined, {
      onSuccess: () => toast.success(t('granted')),
      onError: toastError
    });
  };

  return (
    <div className={s.root}>
      <Gift aria-hidden className={s.icon} size={20} />

      <div className={s.body}>
        <Text as='p' className={s.title}>
          {t('title')}
        </Text>

        <Text size='xs' tone='muted'>
          {t('hint')}
        </Text>
      </div>

      <SubmitButton className={s.action} isPending={claim.isPending} size='md' type='button' onClick={onClaim}>
        {t('action')}
      </SubmitButton>
    </div>
  );
};
