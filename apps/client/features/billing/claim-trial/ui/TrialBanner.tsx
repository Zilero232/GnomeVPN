'use client';

import { Gift } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button, Text } from '@/ui-kit';

import { useClaimTrial } from '../model/hooks';

import s from './TrialBanner.module.scss';

export const TrialBanner = () => {
  const t = useTranslations('trial');
  const tErrors = useTranslations('errors');
  const claim = useClaimTrial();

  const onClaim = () => {
    claim.mutate(undefined, {
      onSuccess: () => toast.success(t('granted')),
      onError: (error: Error) => toast.error(tErrors(error.message))
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

      <Button className={s.action} disabled={claim.isPending} onClick={onClaim}>
        {t('action')}
      </Button>
    </div>
  );
};
