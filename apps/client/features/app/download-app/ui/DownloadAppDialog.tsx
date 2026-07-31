'use client';

import { useTranslations } from 'next-intl';

import { DOWNLOAD_PLATFORMS, useRelease } from '@/entities/app/release';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Spinner } from '@/shared/ui';

import type { DownloadAppDialogProps } from './DownloadAppDialog.types';

import { PlatformCard } from './components';

import s from './DownloadAppDialog.module.scss';

const RELEASES_URL = 'https://github.com/Zilero232/GnomeVPN/releases';

export const DownloadAppDialog = ({ isOpen, onOpenChange }: DownloadAppDialogProps) => {
  const t = useTranslations('downloadApp');
  const { data: release, isLoading, isError } = useRelease(isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className={s.state}>
            <Spinner />
          </div>
        )}

        {isError && (
          <div className={s.state}>
            <span>{t('loadFailed')}</span>
            <a className={s.link} href={RELEASES_URL} rel='noopener noreferrer' target='_blank'>
              {t('openReleases')}
            </a>
          </div>
        )}

        {release && (
          <>
            <div className={s.grid}>
              {DOWNLOAD_PLATFORMS.map(({ id, labelKey, Icon }) => (
                <PlatformCard key={id} asset={release.assets.find((asset) => asset.platform === id)} Icon={Icon} label={t(`platforms.${labelKey}`)} />
              ))}
            </div>

            <div className={s.meta}>
              <span>{t('version', { version: release.version })}</span>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
