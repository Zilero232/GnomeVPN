'use client';

import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Spinner,
  Text
} from '@/shared/ui';

import type { ConfigQrDialogProps } from './ConfigQrDialog.types';

import s from './ConfigQrDialog.module.scss';

export const ConfigQrDialog = ({ config, content, isOpen, onOpenChange }: ConfigQrDialogProps) => {
  const t = useTranslations('configs');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={s.content}>
        <DialogHeader>
          <DialogTitle>{t('qrTitle')}</DialogTitle>
          <DialogDescription>{t('qrHint')}</DialogDescription>
        </DialogHeader>

        <div className={s.code}>
          {content ? (
            <QRCodeSVG level='M' marginSize={2} size={240} value={content} />
          ) : (
            <Spinner />
          )}
        </div>

        <Text className={s.name} size='xs' tone='muted'>
          {config.name} · {config.country}
        </Text>
      </DialogContent>
    </Dialog>
  );
};
