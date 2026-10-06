'use client';

import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/ui-kit';

import type { IncyRotateDialogProps } from './IncyRotateDialog.types';

export const IncyRotateDialog = ({ isOpen, isPending, onOpenChange, onConfirm }: IncyRotateDialogProps) => {
  const t = useTranslations('incy');

  return (
    <ConfirmDialog
      cancelLabel={t('rotateConfirmCancel')}
      confirmLabel={t('rotateConfirmAction')}
      description={t('rotateConfirmBody')}
      isOpen={isOpen}
      isPending={isPending}
      title={t('rotateConfirmTitle')}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />
  );
};
