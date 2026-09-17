'use client';

import { useTranslations } from 'next-intl';

import { INCY_PLATFORMS } from '@/entities/app/incy';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, LinkCard, Text } from '@/ui-kit';

import type { DownloadAppDialogProps } from './DownloadAppDialog.types';

import s from './DownloadAppDialog.module.scss';

export const DownloadAppDialog = ({ isOpen, onOpenChange }: DownloadAppDialogProps) => {
  const t = useTranslations('downloadApp');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className={s.grid}>
          {INCY_PLATFORMS.map(({ id, icon, href }) => (
            <LinkCard key={id} href={href} icon={icon} label={t(`platforms.${id}`)} />
          ))}
        </div>

        <Text size='xs' tone='muted'>
          {t('hint')}
        </Text>
      </DialogContent>
    </Dialog>
  );
};
