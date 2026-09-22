'use client';

import { useTranslations } from 'next-intl';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui-kit';

import type { DeleteAccountDialogProps } from './DeleteAccountDialog.types';

import s from './DeleteAccountDialog.module.scss';

export const DeleteAccountDialog = ({ isOpen, isPending, onOpenChange, onConfirm }: DeleteAccountDialogProps) => {
  const t = useTranslations('account.danger');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={s.content}>
        <DialogHeader>
          <DialogTitle>{t('confirmTitle')}</DialogTitle>
          <DialogDescription>{t('confirmBody')}</DialogDescription>
        </DialogHeader>

        <div className={s.actions}>
          <Button disabled={isPending} variant='ghost' onClick={() => onOpenChange(false)}>
            {t('confirmCancel')}
          </Button>

          <Button disabled={isPending} variant='danger' onClick={onConfirm}>
            {t('confirmAction')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
