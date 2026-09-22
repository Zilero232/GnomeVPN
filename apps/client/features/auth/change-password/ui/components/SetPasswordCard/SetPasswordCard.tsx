'use client';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button, Text } from '@/ui-kit';

import { useSetPassword } from '../../../model/hooks';

import s from './SetPasswordCard.module.scss';

export const SetPasswordCard = () => {
  const t = useTranslations('account.profile');
  const { hasEmail, isPending, send } = useSetPassword({ onSent: () => toast.success(t('passwordLinkSent')) });

  return (
    <div className={s.root}>
      <Text size='sm' tone='muted'>
        {hasEmail ? t('setPasswordHint') : t('setPasswordNeedsEmail')}
      </Text>

      <Button disabled={!hasEmail || isPending} size='md' variant='ghost' onClick={send}>
        {t('setPassword')}
      </Button>
    </div>
  );
};
