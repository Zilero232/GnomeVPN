'use client';

import { useTranslations } from 'next-intl';

import { ConfirmDialog } from '@/ui-kit';

import type { TelegramUnlinkDialogProps } from './TelegramUnlinkDialog.types';

export const TelegramUnlinkDialog = ({ isOpen, isPending, onOpenChange, onConfirm }: TelegramUnlinkDialogProps) => {
  const t = useTranslations('telegram');

  return (
    <ConfirmDialog
      cancelLabel={t('unlinkConfirmCancel')}
      confirmLabel={t('unlinkConfirmAction')}
      description={t('unlinkConfirmBody')}
      isOpen={isOpen}
      isPending={isPending}
      title={t('unlinkConfirmTitle')}
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
    />
  );
};
