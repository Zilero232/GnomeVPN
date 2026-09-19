'use client';

import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Segmented, Text } from '@/ui-kit';

import type { IncyQrDialogProps, QrKind } from './IncyQrDialog.types';

import { DEFAULT_QR_KIND, INCY_QR_KIND, QR_KINDS } from './IncyQrDialog.constants';

import s from './IncyQrDialog.module.scss';

export const IncyQrDialog = ({ deepLink, url, isOpen, onOpenChange }: IncyQrDialogProps) => {
  const t = useTranslations('incy');

  const [kind, setKind] = useState<QrKind>(DEFAULT_QR_KIND);

  const value = kind === INCY_QR_KIND ? deepLink : url;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className={s.content}>
        <DialogHeader>
          <DialogTitle>{t('qrTitle')}</DialogTitle>
          <DialogDescription>{t('qrHint')}</DialogDescription>
        </DialogHeader>

        <Segmented
          aria-label={t('qrKindLabel')}
          className={s.kinds}
          options={QR_KINDS.map((option) => ({ value: option, label: t(`qrKinds.${option}`) }))}
          size='sm'
          value={kind}
          onChange={setKind}
        />

        <div className={s.code}>
          <QRCodeSVG level='M' marginSize={2} size={240} value={value} />
        </div>

        <Text className={s.note} size='xs' tone='muted'>
          {t(`qrKindHints.${kind}`)}
        </Text>

        <Text className={s.note} size='xs' tone='muted'>
          {t('qrNote')}
        </Text>
      </DialogContent>
    </Dialog>
  );
};
