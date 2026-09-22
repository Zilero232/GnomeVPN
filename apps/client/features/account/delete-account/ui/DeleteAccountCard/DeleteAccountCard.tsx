'use client';

import { useTranslations } from 'next-intl';

import { Button, Text } from '@/ui-kit';

import { useDeleteAccount } from '../../model/hooks';
import { DeleteAccountDialog } from '../DeleteAccountDialog';

import s from './DeleteAccountCard.module.scss';

export const DeleteAccountCard = () => {
  const t = useTranslations('account.danger');
  const { isOpen, isPending, open, close, confirm } = useDeleteAccount();

  return (
    <div className={s.root}>
      <div className={s.copy}>
        <Text size='sm' weight='semibold'>
          {t('title')}
        </Text>

        <Text size='xs' tone='muted'>
          {t('body')}
        </Text>
      </div>

      <Button disabled={isPending} size='md' variant='danger' onClick={open}>
        {t('action')}
      </Button>

      <DeleteAccountDialog isOpen={isOpen} isPending={isPending} onConfirm={confirm} onOpenChange={close} />
    </div>
  );
};
