'use client';

import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Text } from '@/ui-kit';

import type { IncyQrDialogProps } from './IncyQrDialog.types';

import s from './IncyQrDialog.module.scss';

export const IncyQrDialog = ({ value, isOpen, onOpenChange }: IncyQrDialogProps) => {
  const t = useTranslations('incy');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={s.content}>
        <DialogHeader>
          <DialogTitle>{t('qrTitle')}</DialogTitle>
          <DialogDescription>{t('qrHint')}</DialogDescription>
        </DialogHeader>

        <div className={s.code}>
          <QRCodeSVG level='M' marginSize={2} size={240} value={value} />
        </div>

        <Text className={s.note} size='xs' tone='muted'>
          {t('qrNote')}
        </Text>
      </DialogContent>
    </Dialog>
  );
};
