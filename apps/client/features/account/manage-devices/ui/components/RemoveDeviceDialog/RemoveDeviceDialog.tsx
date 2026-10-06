'use client';

import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/ui-kit';

import type { RemoveDeviceDialogProps } from './RemoveDeviceDialog.types';

export const RemoveDeviceDialog = ({ name, isOpen, isPending, onOpenChange, onConfirm }: RemoveDeviceDialogProps) => {
  const t = useTranslations('devices');

  return (
    <ConfirmDialog
      cancelLabel={t('confirmCancel')}
      confirmLabel={t('confirmAction')}
      description={t('confirmBody')}
      isOpen={isOpen}
      isPending={isPending}
      title={t('confirmTitle', { name })}
      tone='danger'
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />
  );
};
