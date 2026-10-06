'use client';

import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/ui-kit';

import type { DeleteAccountDialogProps } from './DeleteAccountDialog.types';

import s from './DeleteAccountDialog.module.scss';

export const DeleteAccountDialog = ({ isOpen, isPending, onOpenChange, onConfirm }: DeleteAccountDialogProps) => {
  const t = useTranslations('account.danger');

  return (
    <ConfirmDialog
      cancelLabel={t('confirmCancel')}
      className={s.content}
      confirmLabel={t('confirmAction')}
      description={t('confirmBody')}
      isOpen={isOpen}
      isPending={isPending}
      title={t('confirmTitle')}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />
  );
};
