'use client';

import { useTranslations } from 'next-intl';

import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/ui-kit';

import type { IncyRotateDialogProps } from './IncyRotateDialog.types';

import s from './IncyRotateDialog.module.scss';

export const IncyRotateDialog = ({ isOpen, isPending, onOpenChange, onConfirm }: IncyRotateDialogProps) => {
  const t = useTranslations('incy');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={s.content}>
        <DialogHeader>
          <DialogTitle>{t('rotateConfirmTitle')}</DialogTitle>
          <DialogDescription>{t('rotateConfirmBody')}</DialogDescription>
        </DialogHeader>

        <div className={s.actions}>
          <Button disabled={isPending} variant='ghost' onClick={() => onOpenChange(false)}>
            {t('rotateConfirmCancel')}
          </Button>

          <Button disabled={isPending} variant='danger' onClick={onConfirm}>
            {t('rotateConfirmAction')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
