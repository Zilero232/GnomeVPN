'use client';

import { useTranslations } from 'next-intl';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui-kit';

import type { TelegramUnlinkDialogProps } from './TelegramUnlinkDialog.types';

import s from './TelegramUnlinkDialog.module.scss';

export const TelegramUnlinkDialog = ({ isOpen, isPending, onOpenChange, onConfirm }: TelegramUnlinkDialogProps) => {
  const t = useTranslations('telegram');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={s.content}>
        <DialogHeader>
          <DialogTitle>{t('unlinkConfirmTitle')}</DialogTitle>
          <DialogDescription>{t('unlinkConfirmBody')}</DialogDescription>
        </DialogHeader>

        <div className={s.actions}>
          <Button disabled={isPending} variant='ghost' onClick={() => onOpenChange(false)}>
            {t('unlinkConfirmCancel')}
          </Button>

          <Button disabled={isPending} variant='danger' onClick={onConfirm}>
            {t('unlinkConfirmAction')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
